#!/usr/bin/env node
/**
 * Free, locally executed classification of ImageKit media metadata.
 * Uses an open ONNX CLIP model via Transformers.js on GitHub Actions CPU.
 * Never makes or publishes sellable products. No paid inference API.
 */
import fs from 'node:fs/promises';
import {pipeline} from '@huggingface/transformers';
import sharp from 'sharp';
import {
  MODEL,CATEGORY_LABELS,BRAND_LABELS,chooseCategory,chooseBrand,dhash,
  duplicateCandidates
} from './ai-utils.mjs';

const MAX = Math.min(250, Math.max(1, Number.parseInt(process.env.AI_BATCH_SIZE || '15', 10) || 15));
const dest='data/ai-classifications.json';
const source='data/imagekit-media.json';

async function main(){
  const media=JSON.parse(await fs.readFile(source,'utf8'));
  let current=[];
  try{ current=JSON.parse(await fs.readFile(dest,'utf8')); }
  catch(error){ if(error.code!=='ENOENT') throw error; }
  if(!Array.isArray(media)||!Array.isArray(current)) throw new Error('Invalid media or AI state');
  const seen=new Set(current.filter(x=>x.status==='pending_review'||x.status==='reviewed').map(x=>x.fileId));
  const todo=media.filter(x=>x.mime?.startsWith('image/')&&x.url?.startsWith('https://ik.imagekit.io/elegancemx/')&&!seen.has(x.fileId))
    .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,MAX);
  console.log('Already classified:',seen.size,'new images to inspect:',todo.length);
  if(!todo.length) return;
  // Initialize model only once per batch. Model downloaded/cached locally.
  const classifier=await pipeline('zero-shot-image-classification',MODEL,{device:'cpu',dtype:'q8'});
  const catPrompts=CATEGORY_LABELS.map(x=>x[1]);
  const brandPrompts=BRAND_LABELS.map(b=>b==='Otro / sin identificar'?'a product without any readable brand logo':'a product visibly displaying the '+b+' brand logo');
  let success=0, errors=0;
  for(const item of todo){
    try{
      const response=await fetch(item.url,{signal:AbortSignal.timeout(25000)});
      if(!response.ok) throw new Error('image HTTP '+response.status);
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length > 15*1024*1024) throw new Error('large image');
      const blob=new Blob([bytes],{type:item.mime});
      const [catResults,brandResults,greyscale]=await Promise.all([
        classifier(blob,catPrompts),
        classifier(blob,brandPrompts),
        sharp(bytes,{failOn:'error'}).resize(9,8,{fit:'fill'}).greyscale().raw().toBuffer()
      ]);
      const cat=chooseCategory(catResults);
      const brand=chooseBrand(brandResults);
      const record={
        fileId:item.fileId,
        imageUrl:item.url,
        filePath:item.filePath,
        createdAt:item.createdAt||null,
        categorySuggestion:cat.category,
        categoryScore:cat.score,
        otherCategories:cat.alternatives,
        brandSuggestion:brand.brand,
        brandScore:brand.score==null?null:Number(brand.score.toFixed(4)),
        brandVerified:false,
        name:null,
        price:null,
        stock:null,
        visualHash:dhash(greyscale),
        duplicateCandidates:[],
        status:'pending_review',
        model:MODEL
      };
      const ix=current.findIndex(x=>x.fileId===item.fileId);
      if(ix>=0) current[ix]=record;else current.push(record);
      success++;
      console.log('Classified',item.fileId,cat.category||'por revisar', 'brand candidate:',brand.brand||'unknown');
    }catch(error){
      errors++;
      console.warn('Could not classify',item.fileId, String(error?.message||error).slice(0,180));
    }
  }
  // A perceptual hash merely identifies visually similar photos, NEVER product identity.
  current.forEach(record=>{record.duplicateCandidates=duplicateCandidates(record,current)});
  current.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||a.fileId.localeCompare(b.fileId));
  await fs.writeFile(dest,JSON.stringify(current,null,2)+'\n','utf8');
  console.log('Saved',success,'suggestions and',errors,'unavailable images. Total suggestions:',current.length);
  if(!success) process.exitCode=1;
}
main().catch(error=>{console.error('AI job error',String(error?.message||error));process.exitCode=1});
