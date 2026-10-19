#!/usr/bin/env python3
"""Validate that staged media is not mistakenly sold as products."""
import json
from pathlib import Path
from urllib.parse import urlsplit

p = Path("data")
media = json.loads((p / "imagekit-media.json").read_text())
duplicates = json.loads((p / "potential-duplicates.json").read_text())
report = json.loads((p / "imagekit-report.json").read_text())
products = json.loads(Path("products.json").read_text())

assert media and isinstance(media, list)
assert len(media) == report["totalUniqueMedia"]
assert sum(m["mime"].startswith("image/") for m in media) == report["imageCount"]
assert sum(m["mime"].startswith("video/") for m in media) == report["videoCount"]
assert len({m["fileId"] for m in media}) == len(media)
assert len({m["url"] for m in media}) == len(media)
assert len({m["filePath"] for m in media}) == len(media)
assert all(urlsplit(m["url"]).hostname == "ik.imagekit.io" for m in media)
assert all(m["filePath"].startswith("/elegance/products/") for m in media)
assert all(d["count"] == len(d["fileIds"]) and d["count"] > 1 for d in duplicates)
assert report["verifiedDuplicateFiles"] is None
assert report["commercialProductsVerified"] == 0
assert products == [], "Stop: staged media is not approved commercial product data."
print(f"PASS: {len(media)} media references validated; no invented commercial listings.")
