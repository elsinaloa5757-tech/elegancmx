#!/usr/bin/env python3
"""ImageKit -> open SmolVLM CPU -> unverified visual drafts. Incremental and idempotent.

Private credentials are never loaded. Read original public photos, do not change them.
This process only emits provisional descriptions and generic Spanish catalog names.
"""
import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module
helpers = import_module("vision-catalog-utils")

MEDIA = Path("data/imagekit-media.json")
OUTPUT = Path("data/vision-drafts.json")
MODEL = "HuggingFaceTB/SmolVLM-256M-Instruct"
MAX = min(40, max(1, int(os.environ.get("VISION_BATCH_SIZE", "20"))))
PROMPT = (
    "Identify the MAIN fashion product in this image, ignoring bags, boxes, "
    "background logos, props, and any brand name that is not on the product itself. "
    "State the product type (sneaker, dress shoe, handbag, cap, etc.), its visible "
    "colors, and any clearly legible logo on the product. If a brand or exact model "
    "is uncertain, say unknown. Reply in two brief sentences."
)

def read_rows(path):
    if not path.exists():
        return []
    rows = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        raise ValueError("Expected array: " + str(path))
    return rows

def save(records):
    OUTPUT.parent.mkdir(exist_ok=True, parents=True)
    OUTPUT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def get_text(generated):
    if isinstance(generated, str):
        return generated
    if isinstance(generated, list):
        texts = []
        for part in generated:
            if isinstance(part, dict) and part.get("role") == "assistant":
                content = part.get("content", "")
                if isinstance(content, list):
                    texts.extend(x.get("text", "") for x in content if isinstance(x, dict))
                elif isinstance(content, str):
                    texts.append(content)
        return " ".join(texts)
    return ""

def main():
    media = read_rows(MEDIA)
    existing = read_rows(OUTPUT)
    by_id = {x["fileId"]: x for x in existing if isinstance(x, dict) and x.get("fileId")}
    candidates = [
        m for m in media if m.get("mime", "").startswith("image/")
        and m.get("fileId")
        and m.get("url", "").startswith("https://ik.imagekit.io/elegancemx/elegance/products/")
        and (m["fileId"] not in by_id or
             ((by_id[m["fileId"]].get("status") == "pilot_error" or
               not by_id[m["fileId"]].get("nameSuggestion")) and
              by_id[m["fileId"]].get("attempts", 0) < 2))
    ]
    routes = read_rows(Path("data/auto-categories.json"))
    pending_ids = {r["fileId"] for r in routes if r.get("fileId") and not r.get("category")}
    cutoff = datetime.now(timezone.utc).timestamp() - 48 * 3600
    def rank(media):
        try:
            date = datetime.fromisoformat(str(media.get("createdAt") or "").replace("Z", "+00:00"))
            updated = date.timestamp()
        except (ValueError, TypeError):
            updated = 0.0
        # Process just-uploaded files first, then old unsorted photos before already categorized ones.
        return (updated >= cutoff, media["fileId"] in pending_ids, updated)
    candidates.sort(key=rank, reverse=True)
    todo = candidates[:MAX]
    print("Vision catalog:", len(by_id), "drafts;", len(candidates), "awaiting;", len(todo), "in this run", flush=True)
    if not todo:
        return
    from transformers import pipeline
    from PIL import Image
    from io import BytesIO
    import requests
    Image.MAX_IMAGE_PIXELS = 35_000_000
    model = pipeline("image-text-to-text", model=MODEL, device="cpu")
    for m in todo:
        fid = m["fileId"]
        attempts = by_id.get(fid, {}).get("attempts", 0) + 1
        try:
            # Fetch images ourselves with deadlines: some remote URLs may hang
            # indefinitely when left to the model's image loader.
            with requests.get(m["url"], timeout=(8, 15), stream=True) as response:
                response.raise_for_status()
                parts = []
                size = 0
                for piece in response.iter_content(65_536):
                    size += len(piece)
                    if size > 8_000_000:
                        raise ValueError("Image over safe 8 MB inference limit")
                    parts.append(piece)
            image = Image.open(BytesIO(b"".join(parts))).convert("RGB")
            image.thumbnail((896, 896), Image.Resampling.LANCZOS)
            messages = [{"role": "user", "content": [
                {"type": "image"},
                {"type": "text", "text": PROMPT},
            ]}]
            output = model(text=messages, images=[image], max_new_tokens=130, return_full_text=False)
            description = helpers.clean_description(get_text(output[0].get("generated_text")) if output else "")
            suggestion = helpers.suggest(description)
            if suggestion:
                record = {
                    "fileId": fid, "imageUrl": m["url"],
                    "visualDescriptionUnverified": description,
                    **suggestion, "source": "smolvlm_open_cpu",
                    "model": MODEL, "attempts": attempts,
                }
            else:
                record = {
                    "fileId": fid, "imageUrl": m["url"],
                    "visualDescriptionUnverified": description,
                    "categorySuggestion": None, "nameSuggestion": None,
                    "colorsSuggestion": [], "status": "requires_review",
                    "verified": False, "source": "smolvlm_open_cpu",
                    "model": MODEL, "attempts": attempts,
                }
            by_id[fid] = record
            print("Draft:", fid, record.get("nameSuggestion") or "sin identificación fiable", flush=True)
        except Exception as exc:
            by_id[fid] = {
                "fileId": fid, "status": "pilot_error", "error": str(exc)[:240],
                "attempts": attempts, "verified": False, "source": "smolvlm_open_cpu",
            }
            print("Draft error for", fid, str(exc)[:150], flush=True)
        # Save after every item; no hallucinated data is ever written as owner approved data.
        save(list(by_id.values()))
    accepted = sum(bool(r.get("nameSuggestion")) for r in by_id.values())
    print("Completed open-vision run. Drafts:", len(by_id), "generic visual proposals:", accepted, flush=True)

if __name__ == "__main__":
    main()
