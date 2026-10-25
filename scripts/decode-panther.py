#!/usr/bin/env python3
"""Reconstruct the exact approved GLB asset from base85/zlib parts. Stdlib only."""
import base64, hashlib, json, pathlib, struct, sys, zlib
repo=pathlib.Path(__file__).resolve().parent.parent
root=repo/'assets'/'panther'
manifest=json.loads((root/'manifest.json').read_text())
parts=[(root/'chunks'/p).read_text().replace('\n','').replace('\r','') for p in manifest['chunks']]
rawcomp=base64.b85decode(''.join(parts))
if hashlib.sha256(rawcomp).hexdigest()!=manifest['compressedSHA256']:raise ValueError('Compressed asset checksum mismatch')
glb=zlib.decompress(rawcomp)
if len(glb)!=manifest['glbBytes'] or hashlib.sha256(glb).hexdigest()!=manifest['glbSHA256']:
 raise ValueError('3D asset integrity check failed')
magic,version,size=struct.unpack_from('<4sII',glb,0)
if magic!=b'glTF' or version!=2 or size!=len(glb):raise ValueError('Invalid glTF 2 GLB header')
json_len,json_type=struct.unpack_from('<I4s',glb,12)
if json_type!=b'JSON':raise ValueError('Missing glTF JSON chunk')
js=json.loads(glb[20:20+json_len])
if len(js.get('skins',[]))!=1 or len(js['skins'][0]['joints'])<25:raise ValueError('Missing rig')
clips={a.get('name') for a in js.get('animations',[])}
if not set(manifest['clips']).issubset(clips):raise ValueError('Missing animation clips')
out=repo/'dist'/'assets'/'panther'/'elegance-panther.glb'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_bytes(glb)
print('Elegance panther:',len(glb),'bytes',len(js['skins'][0]['joints']),'rig bones',len(clips),'clips',out)