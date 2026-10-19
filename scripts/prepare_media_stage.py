#!/usr/bin/env python3
"""Prepare a metadata-only staging index from a read-only ImageKit export.

This script NEVER creates commercial products, labels, brands, prices, or stock.
A same-size grouping is only a potential duplicate, not a verified duplicate.
"""
import collections
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, unquote

SOURCE = Path("exports/imagekit-files.json")
OUT = Path("data")
FIELDS = ("fileId", "name", "filePath", "url", "fileType", "mime", "size", "createdAt")
HOST = "ik.imagekit.io"
ROOT = "/elegancemx/elegance/products/"
ALLOWED_MIME = {"image/webp", "image/jpeg", "video/webm", "video/mp4"}


def main():
    raw = json.loads(SOURCE.read_text(encoding="utf-8"))
    if not isinstance(raw, list) or not raw:
        raise SystemExit("Media export is empty or malformed")
    found_ids, found_paths, found_urls = set(), set(), set()
    media = []
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            raise SystemExit(f"Bad record at index {i}")
        record = {name: item.get(name) for name in FIELDS}
        fid, path, url = record["fileId"], record["filePath"], record["url"]
        if not all(isinstance(v, str) and v for v in (fid, path, url)):
            raise SystemExit(f"Missing required identifiers at index {i}")
        u = urlsplit(url)
        if (u.scheme != "https" or u.hostname != HOST
                or not unquote(u.path).startswith(ROOT)
                or not path.startswith("/elegance/products/") or u.username
                or u.password or u.fragment):
            raise SystemExit(f"Untrusted media URL at index {i}")
        if record["mime"] not in ALLOWED_MIME:
            raise SystemExit(f"Unexpected media MIME at index {i}")
        if not isinstance(record["size"], int) or record["size"] <= 0:
            raise SystemExit(f"Invalid file size at index {i}")
        if fid in found_ids or path in found_paths or url in found_urls:
            raise SystemExit(f"Duplicate identifier, path or URL at index {i}")
        found_ids.add(fid); found_paths.add(path); found_urls.add(url)
        media.append(record)
    media.sort(key=lambda r: r["filePath"])
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "imagekit-media.json").write_text(
        json.dumps(media, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8"
    )

    sizes = collections.defaultdict(list)
    folders = collections.Counter()
    mime_counts = collections.Counter()
    for m in media:
        sizes[(m["mime"], m["size"])].append(m["fileId"])
        folder = ("/elegance/products/videos/" if "/videos/" in m["filePath"]
                  else "/elegance/products/migrated/" if "/migrated/" in m["filePath"]
                  else "/elegance/products/")
        folders[folder] += 1
        mime_counts[m["mime"]] += 1
    candidates = [
        {"mime": key[0], "bytes": key[1], "count": len(ids), "fileIds": sorted(ids)}
        for key, ids in sizes.items() if len(ids) > 1
    ]
    candidates.sort(key=lambda c: (-c["count"], c["mime"], c["bytes"]))
    (OUT / "potential-duplicates.json").write_text(
        json.dumps(candidates, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8"
    )
    report = {
        "totalUniqueMedia": len(media),
        "imageCount": sum(x["mime"].startswith("image/") for x in media),
        "videoCount": sum(x["mime"].startswith("video/") for x in media),
        "folders": dict(sorted(folders.items())),
        "mime": dict(sorted(mime_counts.items())),
        "sameSizeAndMimeCandidateGroups": len(candidates),
        "sameSizeAndMimeCandidateFiles": sum(c["count"] for c in candidates),
        "verifiedDuplicateFiles": None,
        "commercialProductsVerified": 0,
        "notes": "Media metadata only. No product identities, categories, prices, stock or actual content hashes have been recovered."
    }
    (OUT / "imagekit-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
