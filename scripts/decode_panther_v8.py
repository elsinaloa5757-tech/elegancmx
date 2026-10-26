#!/usr/bin/env python3
"""Decode checksummed Elegance V8 CC BY glTF asset into dist.
Author credit: 'black panther' by kenchoo, Sketchfab, CC BY 4.0.
"""
from pathlib import Path
import base64,zlib,hashlib,json,struct
root=Path(__file__).resolve().parents[1]
part_dir=root/'assets/panther/v8-parts'
manifest=json.loads((part_dir/'manifest_v8.json').read_text('utf-8'))
parts=[]
for i in range(manifest['parts']):
 p=part_dir/f'part_{i:03d}.txt'
 parts.append(''.join(p.read_text('ascii').split()))
payload=base64.b85decode(''.join(parts))
assert hashlib.sha256(payload).hexdigest()==manifest['compressed_sha256'],'compressed SHA mismatch'
glb=zlib.decompress(payload)
assert len(glb)==manifest['size'] and hashlib.sha256(glb).hexdigest()==manifest['sha256'],'GLB SHA mismatch'
assert glb[:4]==b'glTF' and struct.unpack_from('<I',glb,4)[0]==2
out=root/'dist/assets/panther';out.mkdir(parents=True,exist_ok=True)
(out/manifest['filename']).write_bytes(glb)
# Standalone 3D panther: keep same animation/mesh assets but exclude gallery nodes from scene.
size=struct.unpack_from('<I',glb,12)[0];doc=json.loads(glb[20:20+size]);doc['scenes'][doc.get('scene',0)]['nodes']=[0]
doc['asset']['extras']['viewer']='Panther without gallery; CC BY original and source credit unchanged.'
js=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode('utf8');js+=b' '*(-len(js)%4)
start=20+size;bin_len=struct.unpack_from('<I',glb,start)[0]
binchunk=glb[start+8:start+8+bin_len]
length=12+8+len(js)+8+len(binchunk)
solo=struct.pack('<4sII',b'glTF',2,length)+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(binchunk),b'BIN\x00')+binchunk
(out/manifest['cat_filename']).write_bytes(solo)
print('Panther V8 verified',len(glb),'gallery',len(solo),'solo')