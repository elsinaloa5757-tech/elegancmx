/** Pure audit of unverified machine proposals against the owner's reviewed references.
 * This is NOT accuracy measurement without a representative labeled sample.
 */
const canonical = value => value === 'Playeras' ? 'Ropa' : (value || null);
export function auditIdentification({media,routes,vision,curation,relations,ai,ownerFeedback=[]}){
  if (![media,routes,vision,ai,ownerFeedback].every(Array.isArray) || !curation?.entries ||
      !Array.isArray(relations?.pairs)) throw new Error('Missing audit inputs');
  const photos=media.filter(x=>x.mime?.startsWith('image/'));
  const ids=new Set(photos.map(x=>x.fileId));
  const byRoute=new Map(routes.map(x=>[x.fileId,x]));
  const byVision=new Map(vision.filter(x=>x?.fileId&&x.status==='requires_review'&&x.verified===false).map(x=>[x.fileId,x]));
  const similarity=new Set();
  for(const pair of relations.pairs)if(ids.has(pair.a)&&ids.has(pair.b)){similarity.add(pair.a);similarity.add(pair.b)}
  const reviewed=Object.entries(curation.entries).filter(([fid,row])=>ids.has(fid)&&row?.reviewed===true&&row.category);
  const reviewedById=new Map(reviewed);
  for(const owner of ownerFeedback){
    if(ids.has(owner?.fileId)&&owner.verifiedByOwner===true&&owner.source==='owner_entered_category'&&owner.category){
      reviewedById.set(owner.fileId,{category:owner.category,reviewed:true});
    }
  }
  const ownerNeighbors=new Map();
  const offer=(target,source)=>{
    if(reviewedById.has(target))return;
    const category=canonical(reviewedById.get(source)?.category);
    if(!category)return;
    const opts=ownerNeighbors.get(target)||[];
    opts.push({fileId:source,category});
    ownerNeighbors.set(target,opts);
  };
  for(const pair of relations.pairs){
    if(ids.has(pair.a)&&ids.has(pair.b)&&Number.isInteger(pair.distance)&&pair.distance<=1){
      offer(pair.a,pair.b);offer(pair.b,pair.a);
    }
  }
  const queue=[],counters={conflict:0,uncategorized:0,ownerDisagreement:0,lowConfidence:0,ownerReferenceSuggestions:0};
  let visionNamed=0,agreement=0,comparisonCount=0,ownerAgreement=0,ownerCompared=0;
  for(const photo of photos){
    const id=photo.fileId,route=byRoute.get(id),v=byVision.get(id),manual=reviewedById.get(id);
    const cat=canonical(route?.category),vcat=canonical(v?.categorySuggestion);
    if(v?.nameSuggestion)visionNamed++;
    const signals=[];
    if(vcat&&cat){
      comparisonCount++;
      if(vcat===cat)agreement++;
      else {signals.push('model_conflict');counters.conflict++}
    }
    if(manual?.category&&cat){
      ownerCompared++;
      if(canonical(manual.category)===cat)ownerAgreement++;
      else {signals.push('owner_differs');counters.ownerDisagreement++}
    }
    if(!cat){signals.push('unclassified');counters.uncategorized++}
    // Low CLIP confidence is a review reason, not evidence the label is wrong.
    if(route?.categorySource==='vision_generic' && !v?.nameSuggestion){
      signals.push('needs_visual_validation');counters.lowConfidence++;
    }
    const hints=ownerNeighbors.get(id)||[];
    const uniqueCats=[...new Set(hints.map(x=>x.category))];
    const ownerHint=uniqueCats.length===1?{category:uniqueCats[0],example:hints[0].fileId}:null;
    if(ownerHint){
      counters.ownerReferenceSuggestions++;
      signals.push('similar_to_owner_reviewed');
      if(cat&&cat!==ownerHint.category)signals.push('owner_example_differs');
    }
    if(!signals.length)continue;
    const critical=signals.includes('owner_differs')||signals.includes('model_conflict')||signals.includes('owner_example_differs');
    queue.push({
      fileId:id, category:cat, visualCategory:vcat,
      reason:critical?'conflict':signals.includes('unclassified')?'unclassified':'needs_review',
      ownerReferenceCategory:ownerHint?.category||null,ownerReferenceFileId:ownerHint?.example||null,
      signals,
      priority:signals.includes('owner_differs')?0:signals.includes('model_conflict')?1:
        signals.includes('owner_example_differs')?1:signals.includes('unclassified')?2:3,
      suggestedRelated:similarity.has(id)
    });
  }
  queue.sort((a,b)=>a.priority-b.priority||a.fileId.localeCompare(b.fileId));
  const result={
    version:1,verified:false,source:'cross_model_review_only',
    note:'CLIP/SmolVLM agreement is NOT validated accuracy. Only owner-reviewed examples count as reference labels.',
    photoCount:photos.length, categorized:photos.length-counters.uncategorized,
    unclassified:counters.uncategorized, visionDrafts:byVision.size, visionNamed,
    comparisonCount, modelAgreement:agreement, modelConflict:counters.conflict,
    // There may be too few labeled photos to measure real-world accuracy.
    ownerReviewedCount:reviewedById.size, ownerCompared, ownerAgreement,
    ownerMeasuredAccuracy:ownerCompared>=30?Number((ownerAgreement/ownerCompared).toFixed(4)):null,
    relatedCandidatePhotos:similarity.size, reviewQueueCount:queue.length,
    counters, queue
  };
  if(!ids.size||queue.some(x=>!ids.has(x.fileId)))throw new Error('Audit contains unknown file identifiers');
  return result;
}
