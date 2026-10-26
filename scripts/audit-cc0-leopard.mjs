// Source evaluation only. Never deploy a third-party GLB without review.
// License: https://www.innerscene.com/tools/library/3d-parts/leopard-4ae8cc29 claims CC0.
import crypto from 'node:crypto';
const url='https://www.innerscene.com/api/library/leopard-4ae8cc29/download';
let response;try {response=await fetch(url,{signal:AbortSignal.timeout(30000),redirect:'follow',headers:{'user-agent':'Elegance 3D asset evaluation (license CC0 verification)'}});}
catch(e){console.log('LEOPARD_SOURCE_FETCH_ERROR:',String(e));process.exit(0)}
console.log('LEOPARD_SOURCE_RESPONSE:',JSON.stringify({status:response.status,type:response.headers.get('content-type'),length:response.headers.get('content-length'),url:response.url}));
if(!response.ok){console.log('LEOPARD_SOURCE_NOT_AVAILABLE');process.exit(0)}
const ab=await response.arrayBuffer();const b=Buffer.from(ab);
if(b.length<500000||b.toString('ascii',0,4)!=='glTF'){console.log('LEOPARD_NOT_GLB',b.length,b.subarray(0,80).toString('hex'));process.exit(0)}
const jsonLength=b.readUInt32LE(12);const d=JSON.parse(b.subarray(20,20+jsonLength).toString());
let primitives=d.meshes?.flatMap(m=>m.primitives||[])||[];
let tris=0;for(const p of primitives){const a=d.accessors?.[p.indices];if(a)tris+=Math.floor(a.count/3)}
const info={size:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex'),meshes:d.meshes?.length,primitives:primitives.length,triangles:tris,materials:d.materials?.length,images:d.images?.length,skins:d.skins?.length||0,animations:d.animations?.map(a=>a.name)||[],extensionsRequired:d.extensionsRequired||[],license:'CC0 stated by Innerscene; provenance requires separate visual QA'};
console.log('LEOPARD_GLB_AUDIT:',JSON.stringify(info));
