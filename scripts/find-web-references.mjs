#!/usr/bin/env node
/**
 * Automatically investigate product codes with a bounded FREE public source.
 * This is textual source discovery, NOT Google Lens, product authenticity, or a
 * verified model label. No manual actions or API keys required.
 */
import fs from 'node:fs/promises';
import {findWikidataCandidates,queryForProduct} from './web-reference-utils.mjs';
const read=async path=>JSON.parse(await fs.readFile(path,'utf8'));
const [media,curation,ocr]=await Promise.all([
 read('data/imagekit-media.json'),read('data/catalog-curation.json'),read('data/ocr-drafts.json')
]);
const valid=new Set(media.filter(x=>x.mime?.startsWith('image/')).map(x=>x.fileId));
const previous=await read('data/web-reference-candidates.json').catch(()=>[]);
if(!Array.isArray(previous)||!Array.isArray(ocr))throw Error('Invalid research caches');
const searches=new Map();
// Existing reviewed model names are the strongest input.
for(const [fileId,row] of Object.entries(curation.entries||{})){
 if(!valid.has(fileId)||row?.reviewed!==true)continue;
 const query=queryForProduct(row);
 if(query)searches.set(fileId,{fileId,query,source:'owner_reviewed_reference'});
}
// OCR is automatic: a visible brand hint AND a model-code candidate are
// needed before we search. OCR does not prove genuine brand or model identity.
for(const record of ocr){
 if(!valid.has(record?.fileId)||searches.has(record.fileId))continue;
 const brand=record?.brandHints?.[0],code=record?.skuCandidates?.[0];
 if(!brand||!code)continue;
 const query=queryForProduct({name:brand+' '+code,brand,description:code});
 if(query)searches.set(record.fileId,{fileId:record.fileId,query,source:'ocr_unverified_brand_and_code'});
}
const seen=new Map(previous.filter(x=>valid.has(x.fileId)).map(x=>[x.fileId,x]));
const budget=Math.min(6,Math.max(1,Number.parseInt(process.env.WEB_REFERENCE_BATCH||'4',10)||4));
let requested=0, completed=0;
const items=[...searches.values()].sort((a,b)=>{
 const ap=a.source==='ocr_unverified_brand_and_code'?0:1;
 const bp=b.source==='ocr_unverified_brand_and_code'?0:1;
 return ap-bp||a.fileId.localeCompare(b.fileId);
});
for(const item of items){
 if(requested>=budget)break;
 if(seen.get(item.fileId)?.query===item.query)continue;
 requested++;
 try{
  const candidates=await findWikidataCandidates(item.query);
  seen.set(item.fileId,{
   fileId:item.fileId,query:item.query,querySource:item.source,
   candidates,verified:false,source:'wikidata_public_text_search',
   note:'Posibles referencias textuales, NO prueba de identidad del producto o autenticidad.'
  });
  completed++;
 }catch(error){
  console.warn('Search postponed:',item.fileId,String(error.message).slice(0,130));
  if(/429|503/.test(String(error.message)))break;
 }
}
const output=[...seen.values()].sort((a,b)=>a.fileId.localeCompare(b.fileId));
await fs.writeFile('data/web-reference-candidates.json',JSON.stringify(output)+'\n');
console.log('Free automated catalog lookups:',completed,'of',requested,'attempted; cached:',output.length);
