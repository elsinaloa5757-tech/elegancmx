#!/usr/bin/env node
/**
 * Create a static, safe Cloudflare Pages distribution for Elegance MX.
 * Copies only allowlisted public assets; private credentials and tooling excluded.
 * The recovered photo archive is public, but unverified media are not products.
 */
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),dir=path.join(root,'dist');
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const [media,route,products,curation,vision,relations,audit]=await Promise.all([
  read('data/imagekit-media.json'),read('data/auto-categories.json'),read('products.json'),read('data/catalog-curation.json'),read('data/vision-drafts.json'),read('data/visual-relations.json'),read('data/identification-audit.json')
]);
if(!Array.isArray(media)||!Array.isArray(route)||!Array.isArray(products))throw Error('Invalid JSON payload');
const imgs=media.filter(x=>x.mime?.startsWith('image/')),videos=media.filter(x=>x.mime?.startsWith('video/'));
if(imgs.length<3909||videos.length<20)throw Error('Historical ImageKit archive incomplete');
if(new Set(media.map(x=>x.fileId)).size!==media.length)throw Error('Duplicate image identifiers');
if(route.length!==imgs.length||route.some(x=>x.canPublish!==false||x.price!==null||x.availability!==null))
  throw Error('Photo archive cannot contain commercial product claims');
if(products.length)throw Error('Unreviewed products.json cannot be deployed as sellable products');
if(curation?.version!==1||!curation.entries||Array.isArray(curation.entries))throw Error('Invalid owner curation state');
const allowedIds=new Set(imgs.map(x=>x.fileId));
if(!Array.isArray(vision)||vision.some(v=>!allowedIds.has(v.fileId)||v.verified!==false||
  ('price' in v)||('stock' in v)||('brandVerified' in v)))throw Error('Unsafe AI vision draft data');
if(new Set(vision.map(v=>v.fileId)).size!==vision.length)throw Error('Duplicate vision draft IDs');
if(relations?.version!==1||relations.verified!==false||!Array.isArray(relations.pairs)||
  relations.pairs.some(p=>!allowedIds.has(p.a)||!allowedIds.has(p.b)||p.a===p.b||
    !Number.isInteger(p.distance)||p.distance<0||p.distance>1||!p.category)||
  relations.candidatePairCount!==relations.pairs.length)
 throw Error('Unsafe visual relation suggestions');
if(audit?.version!==1||audit.verified!==false||audit.photoCount!==imgs.length||
  !Array.isArray(audit.queue)||audit.queue.length!==audit.reviewQueueCount||
  audit.queue.some(x=>!allowedIds.has(x.fileId))||
  audit.queue.some(x=>x.reason!=='conflict'&&x.reason!=='unclassified'&&x.reason!=='needs_review'))
 throw Error('AI quality audit incomplete or unsafe');
const ownerFeedback=await read('data/owner-feedback.json');
if(!Array.isArray(ownerFeedback)||ownerFeedback.some(x=>!allowedIds.has(x.fileId)||
  x.verifiedByOwner!==true||x.source!=='owner_entered_category'||typeof x.category!=='string'||
  Object.keys(x).some(k=>!['fileId','category','source','verifiedByOwner'].includes(k))))
 throw Error('Unsafe owner feedback cache');
const [nameDrafts,ocrDrafts,webRefs]=await Promise.all([
 read('data/name-drafts.json'),read('data/ocr-drafts.json'),read('data/web-reference-candidates.json')
]);
if(nameDrafts?.version!==1||nameDrafts.verified!==false||!Array.isArray(nameDrafts.records)||
 !Array.isArray(ocrDrafts)||!Array.isArray(webRefs))throw Error('Invalid background identification caches');
if(new Set(nameDrafts.records.map(x=>x.fileId)).size!==nameDrafts.records.length||
 nameDrafts.records.some(x=>!allowedIds.has(x.fileId)||x.verified!==false||
  x.nameSuggestion!==null&&(typeof x.nameSuggestion!=='string'||x.nameSuggestion.length>100))||
 ocrDrafts.some(x=>!allowedIds.has(x.fileId)||x.verified!==false||
  !Array.isArray(x.skuCandidates)||!Array.isArray(x.brandHints))||
 webRefs.some(x=>!allowedIds.has(x.fileId)||x.verified!==false||
  !Array.isArray(x.candidates)||x.candidates.some(p=>{
    try{return new URL(p.url).hostname!=='www.wikidata.org'}catch{return true}
  })))throw Error('Unsafe provisional auto identification data');
const sections=await read('data/dynamic-sections.json');
if(sections?.version!==1||sections.verified!==false||
 sections.photoCount!==imgs.length||
 !Array.isArray(sections.categories)||!Array.isArray(sections.brands)||
 !Array.isArray(sections.assignments)||
 sections.categories.some(c=>typeof c.name!=='string'||c.name.length>48||
   (c.parent!==null&&typeof c.parent!=='string'))||
 sections.brands.some(b=>typeof b.name!=='string'||b.name.length>48)||
 sections.assignments.some(x=>!allowedIds.has(x.fileId)||x.fileId===undefined||
   x.verifiedBrand!==true&&x.verifiedBrand!==false||
   x.verifiedCategory!==true&&x.verifiedCategory!==false||
   x.brand&&typeof x.brand!=='string'))
 throw Error('Unsafe or stale dynamic brand/category index');
if(new Set(sections.assignments.map(x=>x.fileId)).size!==sections.assignments.length)
 throw Error('Duplicate dynamic section photo assignments');
if(Object.keys(curation.entries).some(id=>!allowedIds.has(id)))throw Error('Unknown curated photo ID');
if(Object.values(curation.entries).some(row=>['price','stock','availability','size'].some(key=>key in row)))throw Error('No prices, stock or sizes allowed in Studio curation');
const homepage=await fs.readFile('index.html','utf8');
if(!homepage.includes('panel.js')||!homepage.includes('id="quick-categories"')||!homepage.includes('id="product-grid"'))throw Error('Approved functional Elegance storefront missing');
const social=await read('data/social-links.json');
for(const channel of ['whatsapp','facebook','instagram','tiktok']){
 if(!social?.[channel]?.url?.startsWith('https://'))throw Error('Social channel missing safe redirect '+channel);
}
if(!homepage.includes('social-clover.js')||!homepage.includes('social-clover.css'))throw Error('Floating social clover missing');
if(!homepage.includes('id="admin-dialog"')||!homepage.includes('id="admin-nav-open"')||!homepage.includes('admin.js'))throw Error('Secure integrated administrator missing');
const archivePage=await fs.readFile('archivo.html','utf8');
if(!archivePage.includes('catalog-recovery.js'))throw Error('Original recovered photo archive missing');
for(const filename of ['panel.js','panel.css','admin.js','admin.css'])if(!(await fs.stat(filename)).size)throw Error('Missing '+filename);
if(!await fs.stat('assets/elegance-panther.png').then(x=>x.size>100000).catch(()=>false))
  throw Error('Original panther asset missing');
await fs.rm(dir,{recursive:true,force:true});
await fs.mkdir(path.join(dir,'assets'),{recursive:true});
await fs.mkdir(path.join(dir,'data'),{recursive:true});
for(const name of ['index.html','showroom.html','scene-ice-embed.html','scene-inline-v9.css','scene-inline-v9.js','pantera-3d.html','pantera-lab.html','pantera-licensed.html','pantera-realista.html','pantera-ice-v8.html','panel.js','panel.css','admin.js','admin.css','archivo.html',
 'styles.css','app.js','catalog-recovery.js','social-clover.js','social-clover.css','premium-motion.css','premium-motion.js','products.json',
 'laboratorio-ia.html','lab.js','lab.css']){
 await fs.copyFile(name,path.join(dir,name));
}
// Preserve historical links, but redirect to the integrated login — no separate Studio admin.
await fs.writeFile(path.join(dir,'studio.html'), '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/?administrador=1"><script>location.replace("/?administrador=1")</script><title>Elegance MX · Administrador</title><a href="/?administrador=1">Ir al administrador de Elegance MX</a></html>');
await fs.copyFile('assets/elegance-panther.png',path.join(dir,'assets/elegance-panther.png'));
for (const name of ['panther-stage-desktop.jpg','panther-stage-mobile.jpg']) {
 const src=path.join('assets',name);const data=await fs.readFile(src);
 if(data.length<20000||data[0]!==0xff||data[1]!==0xd8) throw Error('Showroom approved image missing: '+name);
 await fs.copyFile(src,path.join(dir,'assets',name));
}
const cloverAsset=await fs.readFile('assets/elegance-social-clover.webp');
if(cloverAsset.byteLength<6000||cloverAsset.toString('ascii',0,4)!=='RIFF'||cloverAsset.toString('ascii',8,12)!=='WEBP')
  throw Error('Approved gemstone clover image missing or invalid');
await fs.copyFile('assets/elegance-social-clover.webp',path.join(dir,'assets/elegance-social-clover.webp'));
for(const name of ['imagekit-media.json','auto-categories.json','auto-categories-summary.json','ai-classifications.json','vision-drafts.json','visual-relations.json','identification-audit.json','web-reference-candidates.json','name-drafts.json','ocr-drafts.json','dynamic-sections.json','social-links.json','catalog-curation.json']){
 await fs.copyFile(path.join('data',name),path.join(dir,'data',name));
}
await fs.writeFile(path.join(dir,'_headers'),
 ['/data/*','  Cache-Control: public, max-age=300','/*.html','  Cache-Control: public, max-age=300',
 '/assets/*','  Cache-Control: public, max-age=86400',''].join('\n'));
// Reconstruct the original rigged GLB from checked-in checksummed segments. Stdlib only.
execFileSync('python3',['scripts/decode-panther.py'],{stdio:'inherit'});
// Reconstruct CC BY 4.0 kenchoo panther; audit SHA before Cloudflare deployment.
execFileSync('python3',['scripts/decode-elegance-panther.py'],{stdio:'inherit'});
execFileSync('python3',['scripts/decode_panther_v8.py'],{stdio:'inherit'});
console.log('Ready for deployment:',imgs.length,'photographs,',videos.length,'videos,',route.filter(x=>x.category).length,'category suggestions,',products.length,'sellable listings');
