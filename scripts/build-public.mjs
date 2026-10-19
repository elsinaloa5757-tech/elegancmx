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
const [media,route,products]=await Promise.all([
  read('data/imagekit-media.json'),read('data/auto-categories.json'),read('products.json')
]);
if(!Array.isArray(media)||!Array.isArray(route)||!Array.isArray(products))throw Error('Invalid JSON payload');
const imgs=media.filter(x=>x.mime?.startsWith('image/')),videos=media.filter(x=>x.mime?.startsWith('video/'));
if(imgs.length<3909||videos.length<20)throw Error('Historical ImageKit archive incomplete');
if(new Set(media.map(x=>x.fileId)).size!==media.length)throw Error('Duplicate image identifiers');
if(route.length!==imgs.length||route.some(x=>x.canPublish!==false||x.price!==null||x.availability!==null))
  throw Error('Photo archive cannot contain commercial product claims');
if(products.length)throw Error('Unreviewed products.json cannot be deployed as sellable products');
if(!await fs.stat('assets/elegance-panther.png').then(x=>x.size>100000).catch(()=>false))
  throw Error('Original panther asset missing');
await fs.rm(dir,{recursive:true,force:true});
await fs.mkdir(path.join(dir,'assets'),{recursive:true});
await fs.mkdir(path.join(dir,'data'),{recursive:true});
for(const name of ['index.html','styles.css','app.js','catalog-recovery.js','products.json',
 'laboratorio-ia.html','lab.js','lab.css']){
 await fs.copyFile(name,path.join(dir,name));
}
await fs.copyFile('assets/elegance-panther.png',path.join(dir,'assets/elegance-panther.png'));
for(const name of ['imagekit-media.json','auto-categories.json','auto-categories-summary.json','ai-classifications.json']){
 await fs.copyFile(path.join('data',name),path.join(dir,'data',name));
}
await fs.writeFile(path.join(dir,'_headers'),
 ['/data/*','  Cache-Control: public, max-age=300','/*.html','  Cache-Control: public, max-age=300',
 '/assets/*','  Cache-Control: public, max-age=86400',''].join('\n'));
console.log('Ready for deployment:',imgs.length,'photographs,',videos.length,'videos,',route.filter(x=>x.category).length,'category suggestions,',products.length,'sellable listings');
