#!/usr/bin/env node
import fs from 'node:fs/promises';
import {findWikidataCandidates,queryForProduct} from './web-reference-utils.mjs';
const [media,curation]=await Promise.all([
 fs.readFile('data/imagekit-media.json','utf8').then(JSON.parse),
 fs.readFile('data/catalog-curation.json','utf8').then(JSON.parse)
]);
const valid=new Set(media.filter(x=>x.mime?.startsWith('image/')).map(x=>x.fileId));
const previous=await fs.readFile('data/web-reference-candidates.json','utf8').then(JSON.parse).catch(()=>[]);
if(!Array.isArray(previous))throw Error('Invalid web candidate cache');
const entries=Object.entries(curation.entries||{})
 .filter(([id,row])=>valid.has(id)&&row?.reviewed===true);
const candidates=entries.map(([fileId,row])=>({fileId,query:queryForProduct(row)}))
 .filter(x=>x.query).sort((a,b)=>a.fileId.localeCompare(b.fileId));
const seen=new Map(previous.filter(x=>valid.has(x.fileId)).map(x=>[x.fileId,x]));
const budget=Math.min(8,Number.parseInt(process.env.WEB_REFERENCE_BATCH||'8',10)||8);
let completed=0;
for(const x of candidates){
 if(completed>=budget)break;
 if(seen.get(x.fileId)?.query===x.query)continue;
 let matches=[];
 try{matches=await findWikidataCandidates(x.query)}
 catch(error){console.warn('Reference search deferred:',x.fileId,String(error.message).slice(0,140));continue}
 seen.set(x.fileId,{fileId:x.fileId,query:x.query,candidates:matches,verified:false,
  source:'wikidata_public_text_search',note:'Solo posibles coincidencias textuales; NO identifica visualmente la fotografía.'});
 completed++;
 console.log('Reference research:',x.fileId,matches.length,'candidates');
}
const out=[...seen.values()].sort((a,b)=>a.fileId.localeCompare(b.fileId));
await fs.writeFile('data/web-reference-candidates.json',JSON.stringify(out)+'\n');
console.log('Free web reference searches',completed,'total cached',out.length);
