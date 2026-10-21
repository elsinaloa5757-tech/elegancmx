#!/usr/bin/env python3
"""Read-only pilot: test a free 256M vision-language model on recently uploaded product photos.
Do not publish predictions, create sellable products, or modify media or Supabase.
"""
import json
from pathlib import Path
from transformers import pipeline

MEDIA = Path("data/imagekit-media.json")
OUT = Path("exports/vision-pilot.json")
MODEL = "HuggingFaceTB/SmolVLM-256M-Instruct"
PROMPT = (
    "Identify the MAIN fashion product in this image, ignoring bags, boxes, "
    "background logos, props, and any brand name that is not on the product itself. "
    "State the product type (sneaker, dress shoe, handbag, cap, etc.), its visible "
    "colors, and any clearly legible logo on the product. If a brand or exact model "
    "is uncertain, say unknown. Reply in two brief sentences."
)

def main():
    media = json.loads(MEDIA.read_text(encoding="utf-8"))
    # Pilot on two most recently created product photos; no manual ID assumptions.
    images = sorted(
        (m for m in media
         if m.get("mime", "").startswith("image/")
         and m.get("url", "").startswith("https://ik.imagekit.io/elegancemx/elegance/products/")),
        key=lambda m: m.get("createdAt") or "",
        reverse=True,
    )[:2]
    if len(images) != 2:
        raise RuntimeError("Need at least two trusted ImageKit photos for a pilot")
    print("Loading open local vision model", MODEL, flush=True)
    model = pipeline("image-text-to-text", model=MODEL, device="cpu")
    results = []
    for item in images:
        try:
            messages = [{"role": "user", "content": [
                {"type": "image", "url": item["url"]},
                {"type": "text", "text": PROMPT},
            ]}]
            output = model(text=messages, max_new_tokens=130)
            content = output[0].get("generated_text", "") if output else ""
            if isinstance(content, list):
                content = " ".join(str(m.get("content", "")) for m in content if m.get("role") == "assistant")
            results.append({
                "fileId": item["fileId"],
                "filename": item.get("name"),
                "visual_description_unverified": str(content)[:700],
                "model": MODEL,
                "status": "requires_review",
            })
            print(json.dumps(results[-1], ensure_ascii=False), flush=True)
        except Exception as error:
            results.append({"fileId": item["fileId"], "error": str(error)[:280], "status": "pilot_error"})
            print("Pilot failure for photo", item["fileId"], str(error)[:200], flush=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if all("error" in r for r in results):
        raise RuntimeError("Neither pilot image could be analyzed")

if __name__ == "__main__":
    main()
