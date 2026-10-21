#!/usr/bin/env node
import fs from 'node:fs/promises';
import {createSectionRegistry} from './dynamic-sections-utils.mjs';
const files=['data/imagekit-media.json','data/auto-categories.json',
 'data/ai-classifications.json','data/vision-drafts.json','data/ocr-drafts.json',
 'data/catalog-curation.json','data/owner-feedback.json'];
const [media,routes,ai,vision,ocr,curation,ownerFeedback]=await Promise.all(
 files.map(p=>fs.readFile(p,'utf8').then(JSON.parse)));
const output=createSectionRegistry({media,routes,ai,vision,ocr,curation,ownerFeedback});
await fs.writeFile('data/dynamic-sections.json',JSON.stringify(output)+'\n');
console.log('Dynamic sections:',output.categories.length,'new subcategories,',
 output.brands.length,'brand filters,',output.assignments.length,'photo assignments');
