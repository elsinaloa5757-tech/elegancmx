#!/usr/bin/env node
/**
 * Automatically organize ImageKit photos into NON-SELLABLE category drafts.
 * Reuse 80 historical WhatsApp labels when the original photo ID matches.
 * NEVER infer brand authenticity, price, availability or product identity.
 */
import fs from 'node:fs/promises';
import {autoCategorize, parseLegacyTsv, routeLegacyTitle, TAXONOMY} from './category-router.mjs';
import {usableRescue} from './low-confidence-utils.mjs';

const media=JSON.parse(await fs.readFile('data/imagekit-media.json','utf8'));
const candidates=JSON.parse(await fs.readFile('data/ai-classifications.json','utf8'));
const legacy=parseLegacyTsv(await fs.readFile('data/legacy-80.tsv','utf8'));
const vision=JSON.parse(await fs.readFile('data/vision-drafts.json','utf8'));
if(!Array.isArray(vision))throw Error('Invalid visual suggestion cache');
const visualById=new Map(vision.filter(v=>v?.fileId).map(v=>[v.fileId,v]));
const byId=new Map(candidates.map(c=>[c.fileId,c]));
const historicalByUuid=new Map(legacy.map(x=>[x.assetkey.toLowerCase(),x]));
if(media.length<1 || historicalByUuid.size!==80)throw Error('Missing image inventory or historical recovery');
const rows=[];
for(const image of media){
  if(!image.mime.startsWith('image/'))continue;
  const uuid=image.filePath.toLowerCase().match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)?.[0];
  const old=historicalByUuid.get(uuid),prediction=byId.get(image.fileId);
  const assigned=autoCategorize({historical:old, ai:prediction});
  // Only promote a provisional category when two distinct CLIP image views
  // agree; this does not verify a product or override historical labels.
  const rescued=old?null:usableRescue(prediction);
  if(!assigned.category && rescued){
    assigned.category=rescued.category;
    assigned.status='auto_draft';
    assigned.source='clip_multiview';
    assigned.score=rescued.score;
  }
  const visual=visualById.get(image.fileId);
  // Only use a precise generic object type when CLIP was inconclusive.
  // Owner-curated categories remain authoritative in the public storefront.
  if(!assigned.category && visual?.verified===false && visual.status==='requires_review'
      && TAXONOMY.includes(visual.categorySuggestion)){
    assigned.category=visual.categorySuggestion;
    assigned.status='auto_draft';
    assigned.source='vision_generic';
    assigned.score=null;
  }
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
  visionDrafts:vision.filter(x=>x.status==='requires_review').length,
  visionGenericCategories:rows.filter(x=>x.categorySource==='vision_generic').length,
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
