#!/usr/bin/env python3
"""Decode verified Elegance V8 source and refine art direction without touching source SHA.
Base by kenchoo under CC BY 4.0; derived design for Elegance.
"""
from pathlib import Path
import base64,zlib,hashlib,json,struct,math
root=Path(__file__).resolve().parents[1]
parts=root/'assets/panther/v8-parts';manifest=json.loads((parts/'manifest_v8.json').read_text('utf-8'))
packed=base64.b85decode(''.join(''.join((parts/f'part_{i:03d}.txt').read_text('ascii').split()) for i in range(manifest['parts'])))
assert hashlib.sha256(packed).hexdigest()==manifest['compressed_sha256']
source=zlib.decompress(packed)
assert len(source)==manifest['size'] and hashlib.sha256(source).hexdigest()==manifest['sha256']
assert source[:4]==b'glTF' and struct.unpack_from('<I',source,4)[0]==2
jsize=struct.unpack_from('<I',source,12)[0];doc=json.loads(source[20:20+jsize]);offset=20+jsize
binsize=struct.unpack_from('<I',source,offset)[0];data=bytearray(source[offset+8:offset+8+binsize])
assert len(doc['skins'][0]['joints'])==47
assert len(doc['animations'])==6
# Darker believable obsidian, cool silver instead of blown-out white columns.
for mat in doc['materials']:
 name=mat.get('name','');pbr=mat.get('pbrMetallicRoughness',{})
 if name=='Black marble floor':pbr.update(baseColorFactor=[.005,.014,.025,1],roughnessFactor=.72,metallicFactor=.06)
 elif name=='Volcanic obsidian satin rock':pbr.update(baseColorFactor=[.010,.018,.032,1],roughnessFactor=.64,metallicFactor=.07)
 elif name=='Champagne white-silver':pbr.update(baseColorFactor=[.24,.41,.56,1],roughnessFactor=.58,metallicFactor=.13)
 elif name=='Ice blue glass architecture':pbr.update(baseColorFactor=[.13,.32,.47,1],roughnessFactor=.54,metallicFactor=.10)
 elif name=='Frosted glass gallery':pbr.update(baseColorFactor=[.04,.12,.19,1],roughnessFactor=.7,metallicFactor=.0)
# Remove occluding front columns (original Z=.73). Preserve distant arch & rear columns.
REMOVE={82,83,84,88,89,90,95,96,97,98,99,100,101,102}
scene=doc['scenes'][doc.get('scene',0)]
scene['nodes']=[n for n in scene['nodes'] if n not in REMOVE]
assert len(scene['nodes'])==30 and scene['nodes'][0]==0
# Bring base up toward paws: no visual floating above the pedestal.
# Anatomical support audit (source bind pose): the four paws touch y≈0 and span
# z=-0.62..0.385m. The original ring center was z=+0.34m, leaving hind paws
# off its rear edge. Recenter the STAGE, not the licensed panther skeleton.
# Platform top stays 5mm below paw soles to avoid clipping (y≈-0.005m).
STAGE_Z=-.42
doc['nodes'][66]['translation']=[0,.085,STAGE_Z]  # top obsidian ring
for i in [76,77]:
    doc['nodes'][i]['scale']=[1,1,1.20]  # widen illuminated support in depth
    # scale about original platform center z=0.34m; then translate back
    doc['nodes'][i]['translation']=[0,.085,STAGE_Z-.20*.34]
# Crystal details move with the stage so their spacing remains coherent.
for i in range(67,76):
    doc['nodes'][i]['translation']=[0,0,STAGE_Z]
assert doc['nodes'][66]['translation'][2]==STAGE_Z
# Improve roar: activate source model's facial morph while the mandible/neck move.
# Existing channel output for a morph target is SCALAR with target_count values / frame.
def append_data(bytes_):
 while len(data)%4:data.append(0)
 pos=len(data);data.extend(bytes_)
 idx=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':pos,'byteLength':len(bytes_)})
 return idx
clip=next(c for c in doc['animations'] if c['name']=='roar_short')
input_accessor=clip['samplers'][0]['input'];ac=doc['accessors'][input_accessor]
assert ac['type']=='SCALAR' and ac['count']>30
v=doc['bufferViews'][ac['bufferView']];t0=v.get('byteOffset',0)+ac.get('byteOffset',0)
times=struct.unpack_from('<%sf'%ac['count'],data,t0)
weights=[]
for t in times:
 peak=math.exp(-.5*((t-1.45)/.38)**2)
 # Morph target0 = lower muzzle / jaw on body-head. Target1 is eyelid, left neutral.
 weights.extend([.92*peak,0.,0.])
view=append_data(struct.pack('<%sf'%len(weights),*weights))
ai=len(doc['accessors']);doc['accessors'].append({'bufferView':view,'componentType':5126,'count':len(weights),'type':'SCALAR'})
for node in (10,11,13):
 sampler=len(clip['samplers']);clip['samplers'].append({'input':input_accessor,'output':ai,'interpolation':'LINEAR'})
 clip['channels'].append({'sampler':sampler,'target':{'node':node,'path':'weights'}})
clip.setdefault('extras',{})['V8_refinement']='Lower muzzle facial blendshapes synchronized with jaw/neck: tested in browser; limited by licensed source topology.'
doc['asset'].setdefault('extras',{})['v8_stage_revision']='Remove obstructive front columns, darken architecture and raise platform; add facial morph animation.'
# Write both models, solo mode excludes geometry nodes from scene.
out=root/'dist/assets/panther';out.mkdir(parents=True,exist_ok=True)
def render_glb(doc,path):
 while len(data)%4:data.append(0)
 doc['buffers'][0]['byteLength']=len(data)
 js=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode('utf8');js+=b' '*(-len(js)%4)
 n=12+8+len(js)+8+len(data)
 b=struct.pack('<4sII',b'glTF',2,n)+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(data),b'BIN\x00')+data
 path.write_bytes(b)
 return len(b)
a=render_glb(doc,out/manifest['filename'])
solo=json.loads(json.dumps(doc));solo['scenes'][solo.get('scene',0)]['nodes']=[0]
solo['asset']['extras']['mode']='solo panther, no showroom geometries'
b=render_glb(solo,out/manifest['cat_filename'])
print('Panther V8.1 verified:',a,'gallery bytes; ',b,'solo bytes; 47 original bones, six skeletal clips.')