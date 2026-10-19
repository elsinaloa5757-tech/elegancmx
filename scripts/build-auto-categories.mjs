#!/usr/bin/env node
/**
 * Automatically organize ImageKit photos into NON-SELLABLE category drafts.
 * Reuse 80 historical WhatsApp labels when the original photo ID matches.
 * NEVER infer brand authenticity, price, availability or product identity.
 */
import fs from 'node:fs/promises';
import {autoCategorize, parseLegacyTsv, routeLegacyTitle} from './category-router.mjs';

const media=JSON.parse(await fs.readFile('data/imagekit-media.json','utf8'));
const candidates=JSON.parse(await fs.readFile('data/ai-classifications.json','utf8'));
const legacy=parseLegacyTsv(await fs.readFile('data/legacy-80.tsv','utf8'));
const byId=new Map(candidates.map(c=>[c.fileId,c]));
const historicalByUuid=new Map(legacy.map(x=>[x.assetkey.toLowerCase(),x]));
if(media.length<1 || historicalByUuid.size!==80)throw Error('Missing image inventory or historical recovery');
const rows=[];
for(const image of media){
  if(!image.mime.startsWith('image/'))continue;
  const uuid=image.filePath.toLowerCase().match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)?.[0];
  const old=historicalByUuid.get(uuid),prediction=byId.get(image.fileId);
  const assigned=autoCategorize({historical:old, ai:prediction});
  rows.push({
    fileId:image.fileId,
    imageUrl:image.url,
    filePath:image.filePath,
    category:assigned.category,
    categoryStatus:assigned.status,
    categorySource:assigned.source,
    categoryScore:assigned.score,
    legacyReference:old?{
      historicalId:old.id,
      historicalName:old.historicalName,
      originalCategory:old.historicalCategory,
      requiresConfirmation:true
    }:null,
    brandConfirmed:null,
    titleConfirmed:null,
    productId:null,
    availability:null,
    price:null,
    canPublish:false
  });
}
rows.sort((a,b)=>a.filePath.localeCompare(b.filePath));
const assigned=rows.filter(x=>x.category);
const sourceCounts={};
const categories={};
for(const r of assigned){sourceCounts[r.categorySource]=(sourceCounts[r.categorySource]||0)+1;categories[r.category]=(categories[r.category]||0)+1}
const summary={
  photoCount:rows.length,
  historicalPhotos:rows.filter(r=>r.legacyReference).length,
  classifiedImages:candidates.length,
  autoAssignedPhotos:assigned.length,
  pendingPhotos:rows.length-assigned.length,
  sources:sourceCounts,
  categories,
  noSellableProductsCreated:true,
  note:'Auto filing is provisional by photo, not proof of distinct or available products.'
};
if(summary.historicalPhotos!==80)throw Error('Historical images did not match all 80 ImageKit photos');
await fs.mkdir('data',{recursive:true});
await fs.writeFile('data/auto-categories.json',JSON.stringify(rows)+'\n');
await fs.writeFile('data/auto-categories-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
