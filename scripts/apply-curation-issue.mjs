#!/usr/bin/env node
/** Safe application of OWNER-ONLY GitHub Issue updates from Elegance Studio. */
import fs from 'node:fs/promises';
const CATEGORIES = new Set(['Tenis','Ropa','Gorras','Bolsas','Accesorios','Pantalones','Calzado',
 'Relojes','Lentes','Joyería','Fragancias','Vestidos','Lencería','Cinturones','Buckets','Playeras']);
const FIELDS = new Set(['category','name','brand','groupId','hidden','reviewed']);
const MAX_ROWS = 80,MAX_BODY=45000;
export const PREFIX='ELEGANCE_STUDIO_V1';
function textField(x,n){
 if(x===null)return null;
 if(typeof x!=='string'||x.trim().length>n||!x.trim())throw Error('Texto no válido (máximo '+n+' caracteres)');
 if(/[\u0000-\u001f<>]/.test(x))throw Error('No se admiten códigos ni etiquetas');
 return x.trim();
}
export function validateBatch(body,allowIds){
 if(typeof body!=='string'||body.length>MAX_BODY||!body.startsWith(PREFIX+'\n'))throw Error('Formato de Studio no reconocido');
 const data=JSON.parse(body.slice(PREFIX.length+1));
 if(data?.version!==1||!Array.isArray(data.changes)||data.changes.length===0||data.changes.length>MAX_ROWS)
   throw Error('Se requieren entre 1 y '+MAX_ROWS+' cambios');
 const used=new Set();
 return data.changes.map(x=>{
   if(!x||typeof x!=='object'||Array.isArray(x)||!allowIds.has(x.fileId)||used.has(x.fileId))throw Error('Foto inexistente o repetida');
   used.add(x.fileId);
   const keys=Object.keys(x).filter(k=>k!=='fileId');
   if(!keys.length||keys.some(k=>!FIELDS.has(k)))throw Error('Campo de edición no permitido');
   const out={fileId:x.fileId};
   for(const key of keys){
     const value=x[key];
     if(key==='category'){
       if(value!==null&&!CATEGORIES.has(value))throw Error('Categoría inválida');
       out.category=value;
     }else if(key==='name'||key==='brand')out[key]=textField(value,key==='name'?100:55);
     else if(key==='groupId'){
       if(value!==null&&!allowIds.has(value))throw Error('Referencia de grupo inexistente');
       out.groupId=value;
     }else{
       if(typeof value!=='boolean')throw Error(key+' debe ser verdadero/falso');
       out[key]=value;
     }
   }
   return out;
 });
}
export function applyBatch(data,changes){
 const merged=structuredClone(data);
 if(merged.version!==1||!merged.entries||typeof merged.entries!=='object'||Array.isArray(merged.entries))
   throw Error('Estado de catálogo no válido');
 for(const {fileId,...patch} of changes){
  const row={...(merged.entries[fileId]||{})};
  for(const [key,value] of Object.entries(patch)){
   if(value===null||value===false)delete row[key];
   else row[key]=value;
  }
  if(Object.keys(row).length)merged.entries[fileId]=row;
  else delete merged.entries[fileId];
 }
 return merged;
}
async function main(){
 const file=process.env.GITHUB_EVENT_PATH;
 if(!file)throw Error('This command requires a GitHub Issue event');
 const event=JSON.parse(await fs.readFile(file,'utf8'));
 const issue=event.issue,repo=process.env.GITHUB_REPOSITORY;
 if(repo!=='elsinaloa5757-tech/elegancmx'||issue?.user?.login!=='elsinaloa5757-tech'||
    issue?.title!=='Elegance Studio | Guardar cambios')
   throw Error('Solo el propietario de Elegance MX puede aplicar cambios');
 const media=JSON.parse(await fs.readFile('data/imagekit-media.json','utf8'));
 const ids=new Set(media.filter(m=>m.mime?.startsWith('image/')).map(m=>m.fileId));
 const edits=validateBatch(issue.body,ids);
 const fileName='data/catalog-curation.json';
 const current=JSON.parse(await fs.readFile(fileName,'utf8'));
 const merged=applyBatch(current,edits);
 await fs.writeFile(fileName,JSON.stringify(merged,null,2)+'\n','utf8');
 console.log('Verified owner issue #'+issue.number+'; saved '+edits.length+' curated photo updates; '+Object.keys(merged.entries).length+' total overrides');
}
if(process.env.GITHUB_EVENT_PATH)main().catch(e=>{console.error(e.message);process.exitCode=1});
