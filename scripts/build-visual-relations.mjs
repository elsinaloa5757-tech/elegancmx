#!/usr/bin/env node
import fs from 'node:fs/promises';
import {buildRelations} from './visual-relations.mjs';
const [ai,routes]=await Promise.all([
 fs.readFile('data/ai-classifications.json','utf8').then(JSON.parse),
 fs.readFile('data/auto-categories.json','utf8').then(JSON.parse)
]);
if(!Array.isArray(ai)||!Array.isArray(routes))throw Error('Invalid media files');
const output=buildRelations(ai,routes);
const allowed=new Set(routes.map(x=>x.fileId));
if(output.pairs.some(x=>!allowed.has(x.a)||!allowed.has(x.b)))throw Error('Relation contains unknown photo');
await fs.writeFile('data/visual-relations.json',JSON.stringify(output)+'\n','utf8');
console.log('Visual similarity pairs for review:',output.candidatePairCount,'from',routes.length,'photos. No items merged.');
