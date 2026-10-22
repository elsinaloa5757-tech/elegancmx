import test from 'node:test';
import assert from 'node:assert/strict';
import {secondViewConsensus,usableRescue,RESCUE_VERSION} from '../scripts/low-confidence-utils.mjs';
const original={categorySuggestion:'Tenis',categoryScore:.53,
  otherCategories:[{category:'Tenis',score:.53},{category:'Calzado',score:.38}]};
const crop={category:'Tenis',score:.77,
  alternatives:[{category:'Tenis',score:.77},{category:'Calzado',score:.32}]};
test('a consistent second view yields ONLY a provisional suggestion',()=>{
  const r=secondViewConsensus(original,crop);
  assert.equal(r.status,'accepted');
  assert.equal(r.verified,undefined);
  assert.equal(usableRescue({...original,rescueReview:r})?.category,'Tenis');
  assert.ok(!('price' in r)&&!('stock' in r)&&!('brandVerified' in r));
});
test('disagreement and narrow margins stay unclassified',()=>{
  assert.equal(secondViewConsensus(original,{...crop,category:'Bolsas'}).status,'ambiguous');
  assert.equal(secondViewConsensus({...original,categoryScore:.39},crop).status,'ambiguous');
  assert.equal(secondViewConsensus(original,{...crop,alternatives:[{score:.77},{score:.70}]}).status,'ambiguous');
  assert.equal(usableRescue({...original,rescueReview:{version:RESCUE_VERSION,status:'accepted',categorySuggestion:'Bolsas',primaryScore:.53,primaryMargin:.15,croppedScore:.77,croppedMargin:.45}}),null);
});
test('malformed scores and stale review versions are never routed',()=>{
  assert.equal(secondViewConsensus({...original,categoryScore:NaN},crop).status,'ambiguous');
  const r=secondViewConsensus(original,crop);
  assert.equal(usableRescue({...original,rescueReview:{...r,version:0}}),null);
  assert.equal(usableRescue({...original,rescueReview:{...r,croppedMargin:.03}}),null);
});
