#!/usr/bin/env node
/**
 * Free second-view CLIP pass for already inspected, low-confidence ImageKit photos.
 * Works on GitHub Actions CPU; never creates verified products, brands, prices or stock.
 * Each photograph is reconsidered once (transient fetch failures may retry once).
 */
import fs from 'node:fs/promises';
import {pipeline} from '@huggingface/transformers';
import sharp from 'sharp';
import {MODEL,CATEGORY_LABELS,chooseCategory} from './ai-utils.mjs';
import {RESCUE_VERSION,secondViewConsensus,usableRescue} from './low-confidence-utils.mjs';
const input='data/ai-classifications.json';
const MAX=Math.min(50,Math.max(1,Number.parseInt(process.env.RESCUE_BATCH_SIZE||'24',10)||24));
async function main(){
  const [media,records,routes]=await Promise.all([
    fs.readFile('data/imagekit-media.json','utf8').then(JSON.parse),
    fs.readFile(input,'utf8').then(JSON.parse),
    fs.readFile('data/auto-categories.json','utf8').then(JSON.parse)
  ]);
  if(!Array.isArray(media)||!Array.isArray(records))throw Error('Invalid catalog files');
  // Prioritize the genuinely unclassified images, not those already helped by
  // a generic SmolVLM suggestion or an exact historical photo reference.
  const pendingIds=new Set(routes.filter(r=>r?.fileId&&!r.category).map(r=>r.fileId));
  const mediaById=new Map(media.filter(m=>m.mime?.startsWith('image/')).map(m=>[m.fileId,m]));
  const todo=records.filter(r=>{
    const media=mediaById.get(r.fileId),v=r.rescueReview;
    const score=Number(r.categoryScore),runnerUp=Number(r.otherCategories?.[1]?.score??0);
    const confident=r.categorySuggestion&&score>=0.6&&(score-runnerUp)>=0.18;
    return !confident&&!usableRescue(r)&&r.status==='pending_review'&&
      media?.url?.startsWith('https://ik.imagekit.io/elegancemx/')&&
      (v?.version!==RESCUE_VERSION||(v.status==='fetch_error'&&Number(v.attempts||0)<2));
  }).sort((a,b)=>
    Number(pendingIds.has(b.fileId))-Number(pendingIds.has(a.fileId)) ||
    String(b.createdAt||'').localeCompare(String(a.createdAt||''))
  ).slice(0,MAX);
  console.log('Second-view review:',todo.length,'of',records.length,'classified photo records');
  if(!todo.length)return;
  const model=await pipeline('zero-shot-image-classification',MODEL,{device:'cpu',dtype:'q8'});
  const labels=CATEGORY_LABELS.map(x=>x[1]);
  let accepted=0,ambiguous=0,errors=0;
  for(const record of todo){
    const item=mediaById.get(record.fileId);
    const attempts=(record.rescueReview?.version===RESCUE_VERSION?Number(record.rescueReview.attempts||0):0)+1;
    try{
      const response=await fetch(item.url,{signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw Error('Image HTTP '+response.status);
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length>15*1024*1024)throw Error('Image above 15 MB limit');
      // Two independent image compositions: original CLIP prediction + fresh crop.
      // Crop is for confidence checking only; original ImageKit asset stays unchanged.
      const crop=await sharp(bytes,{failOn:'error'}).rotate()
        .resize(448,448,{fit:'cover',position:'attention'})
        .jpeg({quality:86}).toBuffer();
      const result=chooseCategory(await model(new Blob([crop],{type:'image/jpeg'}),labels));
      record.rescueReview={...secondViewConsensus(record,result),attempts,
        method:'original_and_attention_crop_clip',verified:false};
      if(record.rescueReview.status==='accepted')accepted++;
      else ambiguous++;
    }catch(error){
      record.rescueReview={version:RESCUE_VERSION,status:'fetch_error',
        categorySuggestion:null,attempts,verified:false,
        error:String(error?.message||error).slice(0,160)};
      errors++;
    }
    // Persist checkpoint even if a subsequent image fails; workflow commits after QA.
    await fs.writeFile(input,JSON.stringify(records,null,2)+'\n','utf8');
  }
  console.log('Second-view drafts:',accepted,'accepted,',ambiguous,'still ambiguous,',errors,'fetch errors');
}
main().catch(e=>{console.error('Second-view review failed:',String(e));process.exitCode=1;});
