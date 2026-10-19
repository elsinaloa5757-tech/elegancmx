/* Elegance MX: visual AI results are suggestions only; human approvals stay local. */
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cats=['Tenis','Bolsas','Playeras','Gorras','Pantalones','Buckets','Relojes','Lentes','Cinturones','Joyería','Accesorios','Fragancias','Memorias','Ropa'];
const storefrontMap={'Playeras':'Ropa','Buckets':'Accesorios','Relojes':'Accesorios','Lentes':'Accesorios','Cinturones':'Accesorios','Joyería':'Accesorios','Fragancias':'Accesorios'};
const KEY='elegancemx_ai_review_v1';
const PAGE_SIZE=24;
let media=[],predictions=new Map(),reviews={},pageNumber=0,visible=[];
try{reviews=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{reviews={};}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(reviews));}catch{$('status').textContent='No se pudieron guardar correcciones: comprueba espacio o privacidad del navegador.';}}
function validPhoto(m){try{const u=new URL(m.url);return u.protocol==='https:'&&u.hostname==='ik.imagekit.io'&&u.pathname.startsWith('/elegancemx/elegance/products/');}catch{return false}}
function getFilter(){
  const text=$('q').value.toLowerCase().trim(),category=$('category').value,status=$('state').value;
  return media.filter(m=>{
    const a=predictions.get(m.fileId),r=reviews[m.fileId];
    if(status==='analyzed'&&!a)return false;
    if(status==='unprocessed'&&a)return false;
    if(status==='approved'&&!r?.approved)return false;
    if(category&&(r?.category||a?.categorySuggestion)!==category)return false;
    return !text||[m.fileId,m.filePath,r?.name,r?.brand,r?.category,a?.categorySuggestion,a?.brandSuggestion].filter(Boolean).join(' ').toLowerCase().includes(text);
  });
}
function selectCategory(value){return '<option value="">Selecciona una categoría</option>'+cats.map(c=>'<option value="'+safe(c)+'"'+(c===value?' selected':'')+'>'+safe(c)+'</option>').join('')}
function render(){
  visible=getFilter();const pageTotal=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));pageNumber=Math.min(pageNumber,pageTotal-1);
  $('page').textContent=(pageNumber+1)+' / '+pageTotal+' · '+visible.length+' fotografías';
  $('prev').disabled=pageNumber===0;$('next').disabled=pageNumber+1>=pageTotal;
  $('total').textContent=media.length.toLocaleString('es-MX')+' fotografías';
  $('processed').textContent=predictions.size.toLocaleString('es-MX');
  $('pending').textContent=[...predictions.keys()].filter(id=>!reviews[id]?.approved).length.toLocaleString('es-MX');
  $('approved').textContent=Object.values(reviews).filter(x=>x.approved).length.toLocaleString('es-MX');
  const chunk=visible.slice(pageNumber*PAGE_SIZE,(pageNumber+1)*PAGE_SIZE);
  $('cards').innerHTML=chunk.map(m=>{
    const p=predictions.get(m.fileId),r=reviews[m.fileId]||{};
    const label=r.category||p?.categorySuggestion||'Sin analizar';
    const score=p?.categoryScore==null?'':(' · prob. relativa '+Math.round(p.categoryScore*100)+'%');
    const dupes=p?.duplicateCandidates?.length||0;
    return '<article class="lab-card" data-id="'+safe(m.fileId)+'">'+
      '<img loading="lazy" decoding="async" src="'+safe(m.url)+'" alt="Imagen real ImageKit '+safe(m.fileId)+'">'+
      '<div><small>'+safe(m.fileId)+'</small><h3>'+safe(label)+'</h3>'+
      '<p>Sugerencia IA'+safe(score)+' · Marca sugerida: '+safe(p?.brandSuggestion||'sin verificar')+'</p>'+
      (dupes?'<p class="warning">⚠ '+dupes+' imágenes visualmente similares: revisar antes de publicar</p>':'')+
      '<label>Nombre confirmado<input data-field="name" maxlength="150" value="'+safe(r.name||'')+'" placeholder="Escribe el nombre real"></label>'+
      '<label>Categoría confirmada<select data-field="category">'+selectCategory(r.category||'')+'</select></label>'+
      '<label>Marca confirmada (opcional)<input data-field="brand" maxlength="90" value="'+safe(r.brand||'')+'" placeholder="Sin verificar"></label>'+
      '<label>ID de agrupación de fotos (opcional)<input data-field="group" maxlength="70" value="'+safe(r.group||'')+'" placeholder="Mismo ID = mismo artículo"></label>'+
      '<button type="button" data-approve="'+safe(m.fileId)+'">'+(r.approved?'Revocar aprobación':'Confirmar artículo')+'</button>'+
      (r.approved?'<p class="chosen">✓ Revisado por persona</p>':'<p class="flag">No publicado</p>')+
      '</div></article>';
  }).join('');
  $('status').textContent=predictions.size?'Propuestas de IA pendientes de validación humana.':'Todavía no hay resultados de clasificación automática. Comprueba el flujo GitHub Actions.';
}
function download(name,text){
  const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function exportVerified(){
  const selected=media.filter(m=>reviews[m.fileId]?.approved);
  if(!selected.length){alert('Primero confirma la identidad de por lo menos un artículo.');return}
  const groups=new Map();
  for(const m of selected){
    const r=reviews[m.fileId];
    if(!r.name?.trim()||!r.category)continue;
    const key=r.group?.trim()?('group:'+r.group.trim()):('image:'+m.fileId);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push({media:m,review:r});
  }
  const result=[],errors=[];
  for(const [key,items] of groups){
    const first=items[0],r=first.review;
    if(items.some(x=>x.review.name!==r.name||x.review.category!==r.category||x.review.brand!==r.brand)){
      errors.push(key+' (nombre, marca o categoría no coinciden)');continue;
    }
    const gallery=[...new Set(items.map(x=>x.media.url))];
    result.push({
      id:'IK-'+first.media.fileId,
      name:r.name.trim(),
      brand:(r.brand||'').trim()||null,
      category:storefrontMap[r.category]||r.category,
      sourceCategory:r.category,
      coverImageUrl:gallery[0],
      images:gallery,
      description:'',
      price:null,
      stock:null,
      reviewStatus:'human_reviewed',
      source:'ImageKit Elegance MX'
    });
  }
  if(errors.length){alert('Corrige estas agrupaciones: '+errors.join(', ').slice(0,500));return}
  download('elegance-productos-revisados.json',JSON.stringify(result,null,2)+'\n');
  $('status').textContent='Descargados '+result.length+' artículos revisados. No se han publicado en la tienda.';
}
$('cards').addEventListener('input',event=>{
  const input=event.target.closest('[data-field]');if(!input)return;
  const id=input.closest('[data-id]')?.dataset.id;if(!id)return;
  const entry=reviews[id]||{};entry[input.dataset.field]=input.value;entry.approved=false;reviews[id]=entry;persist();
});
$('cards').addEventListener('change',event=>{if(event.target.matches('[data-field="category"]'))render()});
$('cards').addEventListener('click',event=>{
  const button=event.target.closest('[data-approve]');if(!button)return;
  const id=button.dataset.approve,old=reviews[id]||{};
  if(!old.approved&&(!old.name?.trim()||!cats.includes(old.category))){alert('Indica nombre y categoría verificados antes de aprobar.');return;}
  reviews[id]={...old,approved:!old.approved};persist();render();
});
for(const id of ['q','category','state'])$(id).addEventListener(id==='q'?'input':'change',()=>{pageNumber=0;render()});
$('prev').addEventListener('click',()=>{pageNumber--;render();window.scrollTo(0,350)});
$('next').addEventListener('click',()=>{pageNumber++;render();window.scrollTo(0,350)});
$('export').addEventListener('click',exportVerified);
$('category').innerHTML+=[...cats].map(x=>'<option>'+safe(x)+'</option>').join('');
Promise.all([fetch('data/imagekit-media.json').then(r=>{if(!r.ok)throw Error('medios '+r.status);return r.json()}),
fetch('data/ai-classifications.json').then(r=>r.ok?r.json():[])]).then(([list,preds])=>{
  if(!Array.isArray(list)||!Array.isArray(preds))throw Error('Formato incorrecto');
  media=list.filter(m=>m.mime?.startsWith('image/')&&validPhoto(m)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  predictions=new Map(preds.filter(x=>x.fileId).map(x=>[x.fileId,x]));
  render();
}).catch(error=>{$('status').textContent='No fue posible cargar datos: '+error.message});
