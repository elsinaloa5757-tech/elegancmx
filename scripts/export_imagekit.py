#!/usr/bin/env python3
"""Read-only ImageKit inventory export for Elegance MX.
Never downloads, modifies or deletes ImageKit assets.
"""
import base64
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.imagekit.io/v1/files"
FOLDERS = ["/elegance/products/migrated/", "/elegance/products/", "/elegance/products/videos/"]
PAGE_SIZE = 1000
MAX_PAGES = 100

def main():
    key = os.environ.get("IMAGEKIT_PRIVATE_KEY", "").strip()
    if not key:
        raise SystemExit("Missing IMAGEKIT_PRIVATE_KEY GitHub Actions secret")
    auth = base64.b64encode((key + ":").encode()).decode()
    inventory = []
    seen = set()
    counts = {}
    for folder in FOLDERS:
        total = 0
        for page in range(MAX_PAGES):
            query = urllib.parse.urlencode({
                "path": folder,
                "skip": page * PAGE_SIZE,
                "limit": PAGE_SIZE,
                "type": "file",
                "sort": "ASC_CREATED",
            })
            req = urllib.request.Request(API + "?" + query, headers={
                "Authorization": "Basic " + auth,
                "Accept": "application/json",
                "User-Agent": "EleganceMX-ReadOnly-Inventory/1.0",
            })
            try:
                with urllib.request.urlopen(req, timeout=45) as response:
                    rows = json.load(response)
            except Exception as exc:
                # Do not print exception details: some HTTP clients include request metadata.
                print(f"ImageKit request failed for {folder}, page {page+1}: {type(exc).__name__}", file=sys.stderr)
                raise SystemExit(1)
            if not isinstance(rows, list):
                raise SystemExit("Unexpected ImageKit response: expected array")
            for row in rows:
                if row.get("type") != "file":
                    continue
                file_id = row.get("fileId")
                url = row.get("url")
                file_path = row.get("filePath", "")
                if not file_id or not isinstance(url, str) or not url.startswith("https://ik.imagekit.io/"):
                    continue
                if file_id in seen:
                    continue
                seen.add(file_id)
                inventory.append({
                    "fileId": file_id,
                    "name": row.get("name"),
                    "filePath": file_path,
                    "url": url,
                    "fileType": row.get("fileType"),
                    "mime": row.get("mime"),
                    "size": row.get("size"),
                    "createdAt": row.get("createdAt"),
                })
                total += 1
            print(f"{folder}: scanned page {page+1}, {len(rows)} entries")
            if len(rows) < PAGE_SIZE:
                break
            time.sleep(0.15)
        else:
            raise SystemExit(f"Safety limit reached for {folder}; inventory may be incomplete")
        counts[folder] = total
    out = Path("exports")
    out.mkdir(exist_ok=True)
    (out / "imagekit-files.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (out / "imagekit-summary.json").write_text(json.dumps({"totalUniqueFiles": len(inventory), "folderNewFiles": counts}, indent=2) + "\n", encoding="utf-8")
    print(f"Export complete: {len(inventory)} unique files")

if __name__ == "__main__":
    main()
