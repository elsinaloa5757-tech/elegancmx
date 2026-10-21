#!/usr/bin/env node
import fs from 'node:fs/promises';
import {makeNameDrafts} from './name-draft-utils.mjs';
const paths=['data/imagekit-media.json','data/auto-categories.json','data/vision-drafts.json',
  'data/ocr-drafts.json','data/web-reference-candidates.json','data/catalog-curation.json'];
const [media,routes,vision,ocr,webRefs,curation]=await Promise.all(
  paths.map(p=>fs.readFile(p,'utf8').then(JSON.parse)));
const result=makeNameDrafts({media,routes,vision,ocr,webRefs,curation});
await fs.writeFile('data/name-drafts.json',JSON.stringify(result)+'\n');
console.log('Background naming',JSON.stringify(result.stats));
