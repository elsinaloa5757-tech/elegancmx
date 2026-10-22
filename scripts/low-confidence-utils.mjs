/** Conservative CLIP second-view consensus. Never a verified product fact. */
export const RESCUE_VERSION=1;
const ALLOWED=new Set(['Tenis','Calzado','Bolsas','Playeras','Ropa','Vestidos','Lencería','Gorras','Pantalones','Buckets','Relojes','Lentes','Cinturones','Joyería','Fragancias','Accesorios','Memorias']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function runnerUp(row,field){
  const alternatives=row?.[field];
  return Array.isArray(alternatives)&&alternatives.length>1?Number(alternatives[1]?.score):NaN;
}
/** Require agreement of the original full image and a new product-focused crop.
 * The thresholds deliberately do not turn uncertain images into sale listings.
 */
export function secondViewConsensus(primary,cropped){
  const cat=primary?.categorySuggestion;
  const ps=primary?.categoryScore,cs=cropped?.score;
  const pm=ps-runnerUp(primary,'otherCategories');
  const cm=cs-runnerUp(cropped,'alternatives');
  const accepted=ALLOWED.has(cat)&&cat===cropped?.category&&
    finite(ps)&&finite(cs)&&finite(pm)&&finite(cm)&&
    ps>=0.44&&pm>=0.05&&cs>=0.64&&cm>=0.18;
  return {
    version:RESCUE_VERSION,status:accepted?'accepted':'ambiguous',
    categorySuggestion:accepted?cat:null,
    primaryScore:finite(ps)?Number(ps.toFixed(4)):null,
    primaryMargin:finite(pm)?Number(pm.toFixed(4)):null,
    croppedScore:finite(cs)?Number(cs.toFixed(4)):null,
    croppedMargin:finite(cm)?Number(cm.toFixed(4)):null
  };
}
export function usableRescue(primary){
  const rescue=primary?.rescueReview;
  if(!rescue||rescue.version!==RESCUE_VERSION||rescue.status!=='accepted'||
     rescue.categorySuggestion!==primary?.categorySuggestion)return null;
  if(!ALLOWED.has(rescue.categorySuggestion)||!finite(rescue.primaryScore)||
     !finite(rescue.primaryMargin)||!finite(rescue.croppedScore)||!finite(rescue.croppedMargin))return null;
  if(rescue.primaryScore<0.44||rescue.primaryMargin<0.05||
     rescue.croppedScore<0.64||rescue.croppedMargin<0.18)return null;
  return {category:rescue.categorySuggestion,score:rescue.croppedScore};
}
