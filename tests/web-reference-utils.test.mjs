import test from 'node:test';
import assert from 'node:assert/strict';
import {queryForProduct,normalizeCandidates,findWikidataCandidates} from '../scripts/web-reference-utils.mjs';
test('generic AI colors and unverified category names never become model search assertions',()=>{
 assert.equal(queryForProduct({name:'Tenis plateados'}),null);
 assert.equal(queryForProduct({name:'Bolsa negra'}),null);
 assert.equal(queryForProduct({name:'Nike tenis'}),null);
 assert.match(queryForProduct({name:'Air Jordan 4 Retro',brand:'Nike'}),/Nike/);
 assert.match(queryForProduct({name:'Nike Dunk Low Retro',brand:'Nike'}),/Nike Dunk Low Retro/);
});
test('only documented source pages are returned as weak textual candidates',()=>{
 const output=normalizeCandidates({query:{search:[
  {title:'Nike Dunk Low sneaker',pageid:1541},
  {title:'Something unrelated',pageid:100},
  {title:'Nike product',pageid:1280}
 ]}},'Nike Dunk Low',3);
 assert.equal(output.length,1);
 assert.match(output[0].url,/wikidata.org\/wiki\/Q1541/);
 assert.equal(output[0].evidence,'text_search_only');
});
test('Wikidata query endpoint is bounded and will never confirm an article',async()=>{
 const fake=async(url,opt)=>{
  assert.equal(new URL(url).hostname,'www.wikidata.org');
  assert.equal(new URL(url).searchParams.get('srlimit'),'8');
  assert.equal(opt.headers['user-agent'].startsWith('EleganceMXResearch'),true);
  return {ok:true,json:async()=>({query:{search:[{title:'Nike Dunk Low sneaker',pageid:1541}]}})};
 };
 const result=await findWikidataCandidates('Nike Dunk Low',fake);
 assert.equal(result.length,1);
 assert.equal(Object.hasOwn(result[0],'verified'),false);
});
