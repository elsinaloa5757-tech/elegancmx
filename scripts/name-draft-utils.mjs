/** Deterministic draft labels from already analyzed photographs.
 * A label is NEVER a verified model, authenticity, price, or stock claim.
 */
const CAT_NAMES={
 Tenis:'Tenis',Calzado:'Calzado',Bolsas:'Bolsa',Playeras:'Playera',Ropa:'Prenda',
 Vestidos:'Vestido',Lencería:'Prenda íntima',Gorras:'Gorra',Pantalones:'Pantalón',
 Buckets:'Sombrero bucket',Relojes:'Reloj',Lentes:'Lentes',Cinturones:'Cinturón',
 Joyería:'Artículo de joyería',Fragancias:'Fragancia',Accesorios:'Accesorio',
 Memorias:'Memoria'
};
const normalize=cat=>cat==='Playeras'?'Ropa':cat;
export function makeNameDrafts({media,routes,vision,ocr,webRefs,curation}){
 if(!Array.isArray(media)||!Array.isArray(routes)||!Array.isArray(vision)
   ||!Array.isArray(ocr)||!Array.isArray(webRefs)||curation?.version!==1)
  throw Error('Invalid name-draft inputs');
 const byRoute=new Map(routes.filter(x=>x.fileId).map(x=>[x.fileId,x]));
 const byVision=new Map(vision.filter(x=>x.fileId&&x.verified===false&&x.status==='requires_review').map(x=>[x.fileId,x]));
 const byOCR=new Map(ocr.filter(x=>x.fileId&&x.verified===false).map(x=>[x.fileId,x]));
 const byResearch=new Map(webRefs.filter(x=>x.fileId&&x.verified===false).map(x=>[x.fileId,x]));
 const entries=curation.entries||{};
 const stats={total:0,visualNames:0,genericNames:0,pendingNames:0,ownerReviewed:0,ocrHints:0,webWithMatches:0};
 const rows=[];
 for(const photo of media){
  if(!photo?.fileId||!String(photo.mime).startsWith('image/'))continue;
  const id=photo.fileId,category=byRoute.get(id)?.category||null;
  const v=byVision.get(id);
  // Do not assign a model name when its image category conflicts with CLIP.
  const matches=v?.nameSuggestion&&typeof v.nameSuggestion==='string'
   &&(category?normalize(category)===normalize(v.categorySuggestion):!!v.categorySuggestion);
  const visual=matches?v.nameSuggestion.trim().slice(0,95):null;
  const generic=category?(CAT_NAMES[category]||'Artículo')+' · Referencia':null;
  const label=visual||generic||null;
  const method=visual?'visual_description_generic':generic?'category_generic':'pending';
  const owner=entries[id]?.reviewed===true;
  const ocrRecord=byOCR.get(id);
  const refs=byResearch.get(id);
  const hints=Array.isArray(ocrRecord?.skuCandidates)?ocrRecord.skuCandidates.slice(0,3):[];
  const hasRefs=Array.isArray(refs?.candidates)&&refs.candidates.length>0;
  stats.total++;
  if(visual)stats.visualNames++;
  else if(generic)stats.genericNames++;
  else stats.pendingNames++;
  if(owner)stats.ownerReviewed++;
  if(hints.length)stats.ocrHints++;
  if(hasRefs)stats.webWithMatches++;
  rows.push({
   fileId:id,category:category||v?.categorySuggestion||null,
   nameSuggestion:label,method,status:owner?'owner_override':'unverified',
   verified:false,source:visual?'smolvlm_open_cpu':generic?'clip_or_history_category':'unidentified',
   modelCandidatesFound:hasRefs?refs.candidates.length:0,
   skuHintsFound:hints.length
  });
 }
 return {version:1,verified:false,
  note:'Los nombres son descripciones provisionales; los modelos exactos encontrados en internet nunca se confirman automáticamente.',
  stats,records:rows};
}
