#!/usr/bin/env python3
"""Reconstruct license-attributed Elegance panther from GitHub text chunks for Cloudflare.
Usage: python3 scripts/decode-elegance-panther.py [target_path]
"""
from pathlib import Path
import base64,zlib,hashlib,json,sys
root=Path(__file__).resolve().parent.parent
chunks=root/'assets/panther/licensed-v6-parts'
manifest=json.loads((chunks/'manifest.json').read_text(encoding='utf8'))
parts=[]
for i in range(manifest['chunks']):
 path=chunks/f'chunk_{i:02d}.txt'
 if not path.exists():raise FileNotFoundError(path)
 parts.append(''.join(path.read_text(encoding='ascii').split()))
compressed=base64.b85decode(''.join(parts))
if hashlib.sha256(compressed).hexdigest()!=manifest['archive_sha256']:
 raise RuntimeError('Compressed archive SHA mismatch')
data=zlib.decompress(compressed)
if len(data)!=manifest['size'] or hashlib.sha256(data).hexdigest()!=manifest['sha256']:
 raise RuntimeError('GLB SHA256 verification failed')
if data[:4]!=b'glTF':raise RuntimeError('Invalid GLB header')
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'dist/assets/panther'/manifest['filename']
out.parent.mkdir(parents=True,exist_ok=True)
out.write_bytes(data)
print('Elegance licensed GLB ready',out,len(data),'bytes; SHA256 verified')