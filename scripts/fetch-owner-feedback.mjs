#!/usr/bin/env node
/** Collect explicitly owner-entered public category corrections from Elegance's
 * sanitized edge API; no authentication token, names, prices or private data.
 * If public API is unavailable retain the last verified cache.
 */
import fs from 'node:fs/promises';
import {TAXONOMY} from './category-router.mjs';
const dest='data/owner-feedback.json';
const url='https://czekazhacqaamwecjthp.supabase.co/functions/v1/elegance-admin';
const allowed=new Set(TAXONOMY);
async function main(){
 const media=JSON.parse(await fs.readFile('data/imagekit-media.json','utf8'));
 const valid=new Set(media.filter(x=>x.mime?.startsWith('image/')).map(x=>x.fileId));
 const last=JSON.parse(await fs.readFile(dest,'utf8'));
 if(!Array.isArray(last))throw Error('Invalid cached feedback');
 let data;
 try{
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({action:'visibility'}),signal:AbortSignal.timeout(17000)});
  if(!r.ok)throw Error('Public photo feedback endpoint HTTP '+r.status);
  data=await r.json();
  if(data?.ok!==true||!Array.isArray(data.media))throw Error('Public feedback schema invalid');
 }catch(error){
  console.warn('Owner feedback unavailable; keeping previously vetted labels:',String(error.message).slice(0,170));
  return;
 }
 const feedback=new Map();
 for(const x of data.media){
  const id=x?.imagekit_file_id,category=x?.category;
  if(!valid.has(id)||!allowed.has(category))continue;
  // This column is only written through the owner's authenticated editing action.
  // Do not copy free-text titles, brand claims or any commercial data.
  feedback.set(id,{fileId:id,category,source:'owner_entered_category',verifiedByOwner:true});
 }
 const rows=[...feedback.values()].sort((a,b)=>a.fileId.localeCompare(b.fileId));
 await fs.writeFile(dest,JSON.stringify(rows)+'\n');
 console.log('Verified public owner category feedback:',rows.length,'(no personal/commercial fields)');
}
await main();
