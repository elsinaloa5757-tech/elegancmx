/** Dynamic, strictly provisional catalog sections.
 * Sources: owner-entered labels, high-separation CLIP logo hints,
 * or a matching OCR+CLIP brand. SmolVLM can propose a specific
 * subcategory from an explicit object description, never a new fact.
 * Keep existing broad categories and all owner overrides untouched.
 */
import {TAXONOMY} from './category-router.mjs';
import {BRAND_LABELS} from './ai-utils.mjs';
export const BUILTIN_BRANDS=['Nike','Jordan','Adidas','New Balance','Puma','Vans',
 'Converse','Louis Vuitton','Gucci','Dior','Prada'];
export const SUBCATEGORY_RULES=[
 {name:'Mochilas',parent:'Bolsas',pattern:/\b(backpacks?|rucksacks?)\b/i},
 {name:'Carteras',parent:'Bolsas',pattern:/\b(wallets?|cardholders?|card holders?)\b/i},
 {name:'Riñoneras',parent:'Bolsas',pattern:/\b(waist bags?|belt bags?|fanny packs?)\b/i},
 {name:'Sandalias',parent:'Calzado',pattern:/\b(sandals?|slides?)\b/i},
 {name:'Botas',parent:'Calzado',pattern:/\b(boots?|ankle boots?)\b/i},
 {name:'Sudaderas',parent:'Ropa',pattern:/\b(hoodies?|sweatshirts?)\b/i},
 {name:'Chamarras',parent:'Ropa',pattern:/\b(jackets?|puffer jackets?)\b/i},
 {name:'Camisas',parent:'Ropa',pattern:/\b(shirts?|button.down shirts?)\b/i},
 {name:'Shorts',parent:'Pantalones',pattern:/\b(shorts?|bermuda shorts?)\b/i},
 {name:'Collares',parent:'Joyería',pattern:/\b(necklaces?|pendants?)\b/i},
 {name:'Pulseras',parent:'Joyería',pattern:/\b(bracelets?|bangles?)\b/i}
];
// Parent categories remain fixed for hydraulic-like data integrity: newly
// detected types appear as dynamic filters, not rewritten raw CLIP labels.
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .trim().toLocaleLowerCase('es-MX');
const brandCatalog=[...new Set([...BUILTIN_BRANDS,...BRAND_LABELS]
 .filter(x=>x&&x!=='Otro / sin identificar'))];
const knownBrandMap=new Map(brandCatalog.map(n=>[fold(n),n]));
export function canonicalBrand(raw,{owner=false}={}){
 const value=String(raw||'').trim();
 if(!value||value.length>48)return null;
 const entry=knownBrandMap.get(fold(value));
 if(entry)return entry;
 // Owner-entered brand may contain a model, e.g. "New Balance 960".
 // Canonicalize longest known prefix rather than creating false new brands.
 const prefix=[...brandCatalog].sort((a,b)=>b.length-a.length)
  .find(b=>fold(value).startsWith(fold(b)+' '));
 if(prefix)return prefix;
 if(!owner)return null;
 if(!/^[\p{L}\p{N}][\p{L}\p{N} .&'’+-]{1,39}$/u.test(value)||
  /^(sin marca|por verificar|otro|otras marcas|gen[eé]rica|unknown|unverified)$/i.test(value))
   return null;
 return value.replace(/\s+/g,' ');
}
function visualSubcategory(v,cat){
 if(v?.status!=='requires_review'||v.verified!==false||!cat||
    !v.visualDescriptionUnverified)return null;
 const desc=String(v.visualDescriptionUnverified).slice(0,320);
 const possible=SUBCATEGORY_RULES.filter(r=>r.parent===cat&&
   r.pattern.test(desc)&&!new RegExp('\\b(?:no|not|without)\\s+(?:a\\s+)?(?:'+r.pattern.source+')','i').test(desc));
 return possible.length===1?possible[0].name:null;
}
export function createSectionRegistry({media,routes,ai,vision,ocr,curation,ownerFeedback=[]}){
 if(![media,routes,ai,vision,ocr,ownerFeedback].every(Array.isArray) ||
 !curation||curation.version!==1||!curation.entries)throw Error('Invalid dynamic registry inputs');
 const ids=new Set(media.filter(x=>x?.mime?.startsWith('image/')).map(x=>x.fileId));
 const byRoute=new Map(routes.filter(x=>ids.has(x.fileId)).map(x=>[x.fileId,x]));
 const byAI=new Map(ai.filter(x=>ids.has(x.fileId)).map(x=>[x.fileId,x]));
 const byVision=new Map(vision.filter(x=>ids.has(x.fileId)).map(x=>[x.fileId,x]));
 const byOCR=new Map(ocr.filter(x=>ids.has(x.fileId)).map(x=>[x.fileId,x]));
 const approved=new Map(ownerFeedback.filter(x=>ids.has(x.fileId)&&x.verifiedByOwner)
   .map(x=>[x.fileId,x.category]));
 const catSections=new Map(),brandSections=new Map(),assignments=[];
 let pending=0,unresolvedBrand=0;
 function add(map,key,owner){
  if(!map.has(key))map.set(key,{name:key,photoCount:0,ownerSources:0});
  const row=map.get(key);row.photoCount++;if(owner)row.ownerSources++;
 }
 for(const file of media){
  if(!ids.has(file.fileId))continue;
  const id=file.fileId;
  const manual=curation.entries[id]||{};
  const fixedCat=manual.reviewed===true&&typeof manual.category==='string'?
    manual.category:approved.get(id);
  const parent=String(fixedCat||byRoute.get(id)?.category||'').trim();
  const validParent=TAXONOMY.includes(parent)?parent:null;
  const ownerCustom=!!fixedCat&&!validParent&&
    /^[\\p{L}][\\p{L}\\p{N} /&'-]{1,37}$/u.test(parent) &&
    !/^(sin categor[ií]a|por clasificar|sin identificar)$/i.test(parent);
  const proposed=ownerCustom?parent:validParent&&!fixedCat?
    visualSubcategory(byVision.get(id),validParent):null;
  const aiRow=byAI.get(id),ocrRow=byOCR.get(id);
  const manualBrand=manual.reviewed===true?canonicalBrand(manual.brand,{owner:true}):null;
  // CLIP brandSuggestion is already gated by chooseBrand: p>=0.7,
  // separation>=0.4. Never declare model authenticity or brandVerified.
  const clip=canonicalBrand(aiRow?.brandSuggestion);
  const ocrHints=(ocrRow?.verified===false&&Array.isArray(ocrRow.brandHints))?
    ocrRow.brandHints.map(b=>canonicalBrand(b)).filter(Boolean):[];
  const corroborated=clip&&ocrHints.includes(clip);
  const brand=manualBrand||clip||null;
  if(!brand)unresolvedBrand++;
  if(!validParent&&!ownerCustom)pending++;
  if(proposed){
   add(catSections,proposed,ownerCustom);
   catSections.get(proposed).parent=ownerCustom?null:validParent;
  }
  if(manualBrand)add(brandSections,manualBrand,true);
  else if(brand)add(brandSections,brand,false);
  if(proposed||brand){
   assignments.push({fileId:id,subCategory:proposed,brand,
    brandEvidence:manualBrand?'owner_approved':
      corroborated?'clip_and_ocr':clip?'clip_logo_candidate':null,
    verifiedBrand:!!manualBrand,verifiedCategory:!!ownerCustom});
  }
 }
 assignments.sort((a,b)=>a.fileId.localeCompare(b.fileId));
 return {
  version:1,verified:false,source:'dynamic_sections_review_safe',
  note:'Secciones provisionales. Las marcas detectadas no acreditan autenticidad ni modelo.',
  photoCount:ids.size,pendingCategoryCount:pending,pendingBrandCount:unresolvedBrand,
  categories:[...catSections.values()].sort((a,b)=>b.photoCount-a.photoCount||a.name.localeCompare(b.name,'es')),
  brands:[...brandSections.values()].sort((a,b)=>b.photoCount-a.photoCount||a.name.localeCompare(b.name,'es')),
  assignments
 };
}
