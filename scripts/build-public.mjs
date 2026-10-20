#!/usr/bin/env node
/**
 * Create a static, safe Cloudflare Pages distribution for Elegance MX.
 * Copies only allowlisted public assets; private credentials and tooling excluded.
 * The recovered photo archive is public, but unverified media are not products.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),dir=path.join(root,'dist');
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const [media,route,products,curation]=await Promise.all([
  read('data/imagekit-media.json'),read('data/auto-categories.json'),read('products.json'),read('data/catalog-curation.json')
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
for(const filename of ['panel.js','panel.css','admin.js','admin.css','studio.js','studio.css'])if(!(await fs.stat(filename)).size)throw Error('Missing '+filename);
if(!await fs.stat('assets/elegance-panther.png').then(x=>x.size>100000).catch(()=>false))
  throw Error('Original panther asset missing');
await fs.rm(dir,{recursive:true,force:true});
await fs.mkdir(path.join(dir,'assets'),{recursive:true});
await fs.mkdir(path.join(dir,'data'),{recursive:true});
for(const name of ['index.html','panel.js','panel.css','admin.js','admin.css','studio.html','studio.js','studio.css','archivo.html',
 'styles.css','app.js','catalog-recovery.js','social-clover.js','social-clover.css','products.json',
 'laboratorio-ia.html','lab.js','lab.css']){
 await fs.copyFile(name,path.join(dir,name));
}
await fs.copyFile('assets/elegance-panther.png',path.join(dir,'assets/elegance-panther.png'));
const cloverAsset=await fs.readFile('assets/elegance-social-clover.webp');
if(cloverAsset.byteLength<6000||cloverAsset.toString('ascii',0,4)!=='RIFF'||cloverAsset.toString('ascii',8,12)!=='WEBP')
  throw Error('Approved gemstone clover image missing or invalid');
await fs.copyFile('assets/elegance-social-clover.webp',path.join(dir,'assets/elegance-social-clover.webp'));
for(const name of ['imagekit-media.json','auto-categories.json','auto-categories-summary.json','ai-classifications.json','social-links.json','catalog-curation.json']){
 await fs.copyFile(path.join('data',name),path.join(dir,'data',name));
}
await fs.writeFile(path.join(dir,'_headers'),
 ['/data/*','  Cache-Control: public, max-age=300','/*.html','  Cache-Control: public, max-age=300',
 '/assets/*','  Cache-Control: public, max-age=86400',''].join('\n'));
console.log('Ready for deployment:',imgs.length,'photographs,',videos.length,'videos,',route.filter(x=>x.category).length,'category suggestions,',products.length,'sellable listings');
