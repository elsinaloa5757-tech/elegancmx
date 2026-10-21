#!/usr/bin/env python3
"""Free, bounded ImageKit product-label OCR. Only safe model-code and brand hints.
No paid API, no raw OCR text or people/contact details are saved or published.
"""
import io
import json
import os
import re
import time
from pathlib import Path

MEDIA=Path("data/imagekit-media.json")
OUTPUT=Path("data/ocr-drafts.json")
BRANDS=[
  ("New Balance", r"\bNEW\s*BALANCE\b"),
  ("Louis Vuitton", r"\bLOUIS\s*VUITTON\b"),
  ("Michael Kors", r"\bMICHAEL\s*KORS\b"),
  ("Ray-Ban", r"\bRAY[- ]?BAN\b"),
  ("Nike", r"\bNIKE\b"),
  ("Jordan", r"\bJORDAN\b"),
  ("Adidas", r"\bADIDAS\b"),
  ("Puma", r"\bPUMA\b"),
  ("Vans", r"\bVANS\b"),
  ("Gucci", r"\bGUCCI\b"),
  ("Dior", r"\bDIOR\b"),
  ("Prada", r"\bPRADA\b"),
  ("Casio", r"\bCASIO\b"),
  ("Seiko", r"\bSEIKO\b"),
  ("Rolex", r"\bROLEX\b"),
  ("Coach", r"\bCOACH\b"),
]
# A product code should contain digits and a separator, not just a word or time.
CODE=re.compile(r"\b[A-Z0-9]{2,10}[-_/][A-Z0-9]{2,8}(?:[-_/][A-Z0-9]{2,6})?\b")
def collect_hints(text):
    text=str(text or "").upper()[:5000]
    brands=[brand for brand,pat in BRANDS if re.search(pat,text)]
    codes=[]
    for x in CODE.findall(text):
        x=x.replace("_","-").replace("/","-")
        if not re.search(r"\d",x) or re.fullmatch(r"\d{4}-\d{2}-\d{2}",x):
            continue
        if x not in codes:codes.append(x)
    return {"brandHints":brands[:3], "skuCandidates":codes[:5]}

def main():
    import requests
    from PIL import Image,ImageOps
    import pytesseract
    Image.MAX_IMAGE_PIXELS=28_000_000
    media=json.loads(MEDIA.read_text())
    old=json.loads(OUTPUT.read_text()) if OUTPUT.exists() else []
    if not isinstance(media,list) or not isinstance(old,list):
        raise ValueError("Invalid OCR cache or image archive")
    known={x["fileId"]:x for x in old if isinstance(x,dict) and x.get("fileId")}
    categories=json.loads(Path("data/auto-categories.json").read_text())
    unclassified={x["fileId"] for x in categories if x.get("fileId") and not x.get("category")}
    limit=min(45,max(1,int(os.environ.get("OCR_BATCH_SIZE","20"))))
    valid=[m for m in media if isinstance(m,dict) and m.get("mime","").startswith("image/")
           and str(m.get("url","")).startswith("https://ik.imagekit.io/elegancemx/elegance/products/")
           and m.get("fileId") not in known]
    # Recent first; pending classification next.
    valid.sort(key=lambda m:(str(m.get("createdAt") or "") >= "2026-10-01",
                             m["fileId"] in unclassified,str(m.get("createdAt") or "")),reverse=True)
    count=0
    for item in valid[:limit]:
        fid=item["fileId"]
        try:
            with requests.get(item["url"],timeout=(8,16),stream=True) as reply:
                reply.raise_for_status()
                chunks=[];n=0
                for part in reply.iter_content(65536):
                    n+=len(part)
                    if n>7_000_000:raise ValueError("Too large for OCR")
                    chunks.append(part)
            im=Image.open(io.BytesIO(b"".join(chunks)))
            im=ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((1800,1800))
            # Avoid slow or hostile files. Tesseract has an internal timeout.
            raw=pytesseract.image_to_string(im,lang="eng",config="--psm 11",timeout=10)
            hints=collect_hints(raw)
            status="hints_found" if hints["skuCandidates"] or hints["brandHints"] else "no_legible_codes"
            known[fid]={"fileId":fid,**hints,"status":status,"verified":False,
                "source":"tesseract_local_ocr","attempts":1}
        except Exception as error:
            known[fid]={"fileId":fid,"brandHints":[],"skuCandidates":[],"status":"ocr_error",
                "verified":False,"source":"tesseract_local_ocr","attempts":1,
                "error":str(error)[:120]}
        count+=1
        # Checkpoint every image so a failed runner doesn't erase progress.
        OUTPUT.write_text(json.dumps(sorted(known.values(),key=lambda x:x["fileId"]),ensure_ascii=False)+"\n")
    print("Free OCR images processed:",count,"total:",len(known),
          "with product codes:",sum(bool(x.get("skuCandidates")) for x in known.values()))

if __name__=="__main__":
    main()
