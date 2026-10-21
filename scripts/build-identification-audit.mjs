#!/usr/bin/env node
import fs from 'node:fs/promises';
import {auditIdentification} from './identification-audit.mjs';
const files=['data/imagekit-media.json','data/auto-categories.json','data/vision-drafts.json','data/catalog-curation.json','data/visual-relations.json','data/ai-classifications.json'];
const [media,routes,vision,curation,relations,ai]=await Promise.all(files.map(p=>fs.readFile(p,'utf8').then(JSON.parse)));
const audit=auditIdentification({media,routes,vision,curation,relations,ai});
await fs.writeFile('data/identification-audit.json',JSON.stringify(audit)+'\n');
console.log('Elegance AI audit',JSON.stringify({
 total:audit.photoCount,modelsCompared:audit.comparisonCount,
 conflict:audit.modelConflict,uncategorized:audit.unclassified,
 ownerReviewed:audit.ownerReviewedCount,ownerMeasuredAccuracy:audit.ownerMeasuredAccuracy,
 queue:audit.reviewQueueCount
}));
