import {hashDistance} from './ai-utils.mjs';
/** Produce conservative similarity suggestions, NEVER approved products or forced merges.
 * Uses existing perceptual-hash nearest neighbors: exact or 1-bit difference,
 * with compatible categories. Different viewing angles may not be detected.
 */
export function buildRelations(ai, routes){
  const byId=new Map(ai.filter(x=>x?.fileId).map(x=>[x.fileId,x]));
  const byCategory=new Map(routes.filter(x=>x?.fileId).map(x=>[x.fileId,x.category]));
  const pairs=[];
  const keys=new Set();
  for(const record of ai){
    if(!record?.fileId || !/^[a-f0-9]{16}$/i.test(record.visualHash||''))continue;
    const category=byCategory.get(record.fileId);
    if(!category)continue;
    for(const candidate of record.duplicateCandidates||[]){
      if(!candidate?.fileId || !Number.isInteger(candidate.distance) || candidate.distance>1 || candidate.distance<0)continue;
      const other=byId.get(candidate.fileId);
      if(!other || byCategory.get(other.fileId)!==category)continue;
      if(!/^[a-f0-9]{16}$/i.test(other.visualHash||''))continue;
      if(hashDistance(record.visualHash,other.visualHash)!==candidate.distance)continue;
      const left=record.fileId<other.fileId?record:other;
      const right=record.fileId<other.fileId?other:record;
      if(left.fileId===right.fileId)continue;
      const key=left.fileId+':'+right.fileId;
      if(keys.has(key))continue;
      keys.add(key);
      pairs.push({a:left.fileId,b:right.fileId,category,distance:candidate.distance});
    }
  }
  pairs.sort((a,b)=>a.distance-b.distance||a.a.localeCompare(b.a)||a.b.localeCompare(b.b));
  return {
    version:1,
    source:'perceptual_hash_similar_not_same_product',
    verified:false,
    interpretation:'Fotos visualmente parecidas; NO prueba de que sean el mismo producto. No se han fusionado.',
    photoCount:byCategory.size,
    candidatePairCount:pairs.length,
    pairs
  };
}
