(()=>{'use strict';
const OWNER='elsinaloa5757-tech/elegancmx',DRAFT='elegance_studio_drafts_v1',PAGE=36;
const CATS=['Tenis','Ropa','Gorras','Bolsas','Accesorios','Pantalones','Calzado','Relojes','Lentes','Joyería','Fragancias','Vestidos','Lencería','Cinturones','Buckets','Playeras'];
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={media:[],routes:new Map(),ai:new Map(),saved:{},drafts:{},selected:new Set(),status:'all',category:'',search:'',page:0,current:null};
function localLoad(){try{const x=JSON.parse(localStorage.getItem(DRAFT)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return{}}}
function saveDrafts(){try{localStorage.setItem(DRAFT,JSON.stringify(state.drafts))}catch{message('El navegador no permitió guardar cambios locales; exporta una copia JSON.')}updateStats()}
const current=id=>({...state.saved[id],...state.drafts[id]});
const route=id=>state.routes.get(id)||{};
const ai=id=>state.ai.get(id)||{};
const cat=id=>{const row=current(id);return row.category===null?null:row.category||route(id).category||ai(id).categorySuggestion||null};
const label=m=>current(m.fileId).name||route(m.fileId).legacyReference?.historicalName||'Fotografía sin nombre confirmado';
const image=m=>m.url;
const validPhoto=m=>{try{const u=new URL(m.url);return m.mime?.startsWith('image/')&&u.protocol==='https:'&&u.hostname==='ik.imagekit.io'&&u.pathname.startsWith('/elegancemx/elegance/products/')}catch{return false}};
function save(id,patch){
 state.drafts[id]={...(state.drafts[id]||{}),...patch};
 saveDrafts();render();
}
function compact(x){return x.toLocaleString('es-MX')}
function updateStats(){
 $('stat-total').textContent=compact(state.media.length);
 $('stat-ai').textContent=compact(state.ai.size);
 $('stat-category').textContent=compact(state.media.filter(m=>Boolean(cat(m.fileId))).length);
 $('stat-reviewed').textContent=compact(state.media.filter(m=>current(m.fileId).reviewed===true).length);
 const n=Object.keys(state.drafts).length;
 $('stat-edits').textContent=compact(n);
 $('studio-publish').disabled=n===0;
 $('studio-export').disabled=n===0;
 if(!n)$('studio-save-status').textContent='No hay cambios pendientes de publicación.';
}
function filter(){
 return state.media.filter(m=>{
  const id=m.fileId,row=current(id),kind=cat(id);
  if(state.status==='pending'&&kind)return false;
  if(state.status==='ai'&&!state.ai.has(id))return false;
  if(state.status==='reviewed'&&!row.reviewed)return false;
  if(state.status==='unreviewed'&&row.reviewed)return false;
  if(state.status==='hidden'&&!row.hidden)return false;
  if(state.status==='similar'&&!ai(id).duplicateCandidates?.length)return false;
  if(state.category&&kind!==state.category)return false;
  if(state.search&&!([id,m.filePath,label(m),kind,row.brand,ai(id).brandSuggestion].filter(Boolean)
    .join(' ').toLocaleLowerCase('es-MX').includes(state.search)))return false;
  return true;
 });
}
function card(m){
 const id=m.fileId,row=current(id),category=cat(id),a=ai(id),selected=state.selected.has(id);
 const status=row.reviewed?'✓ Revisada':a.categorySuggestion?'IA por revisar':category?'Sin revisión':'Sin clasificar';
 return '<article class="photo-card'+(selected?' selected':'')+'" data-id="'+esc(id)+'">'+
  '<button type="button" class="thumb" data-edit="'+esc(id)+'" aria-label="Editar '+esc(id)+'"><img src="'+esc(image(m))+'" loading="lazy" alt="'+esc(label(m))+'"></button>'+
  '<button type="button" class="select" data-select="'+esc(id)+'" aria-label="'+(selected?'Quitar selección':'Seleccionar fotografía')+'" aria-pressed="'+selected+'">'+(selected?'✓':'□')+'</button>'+
  '<div class="photo-info"><strong>'+esc(label(m))+'</strong><small>'+esc(id.slice(0,12))+'</small>'+
  '<span class="tag">'+esc(category||'Por clasificar')+'</span><small class="ai-tag">'+esc(status)+(row.hidden?' · Oculta':'')+
  (row.groupId?' · Agrupada':'')+'</small>'+
  '<button type="button" class="edit" data-edit="'+esc(id)+'">Editar / revisar</button></div></article>';
}
function render(){
 const rows=filter(),pages=Math.max(1,Math.ceil(rows.length/PAGE));
 state.page=Math.min(Math.max(0,state.page),pages-1);
 $('studio-grid').innerHTML=rows.slice(state.page*PAGE,(state.page+1)*PAGE).map(card).join('');
 $('studio-count').textContent=compact(rows.length)+' fotografías con estos filtros';
 $('selection-count').textContent=state.selected.size?state.selected.size+' seleccionadas':'';
 $('studio-empty').hidden=rows.length>0;
 $('studio-page').textContent='Página '+(state.page+1)+' de '+pages;
 $('studio-prev').disabled=state.page===0;$('studio-next').disabled=state.page>=pages-1;
 updateStats();
}
function openEditor(id){
 const m=state.media.find(x=>x.fileId===id);if(!m)return;
 state.current=id;
 const row=current(id),a=ai(id);
 $('studio-preview').src=image(m);
 $('studio-edit-ref').textContent='ImageKit: '+id;
 $('edit-category').value=cat(id)||'';
 $('edit-name').value=row.name||'';
 $('edit-brand').value=row.brand||'';
 $('edit-group').value=row.groupId||'';
 $('edit-reviewed').checked=!!row.reviewed;
 $('edit-hidden').checked=!!row.hidden;
 $('studio-suggestion').textContent='Sugerencia IA: '+(a.categorySuggestion||'sin clasificar')+
  (typeof a.categoryScore==='number'?' ('+Math.round(a.categoryScore*100)+' % de puntuación de similitud)':'')+
  (a.duplicateCandidates?.length?' · '+a.duplicateCandidates.length+' fotos visualmente similares':'')+
  '. La IA no garantiza la marca ni que sean el mismo artículo.';
 $('studio-edit').showModal();
}
function message(x){$('studio-save-status').textContent=x}
function prepareIssue(){
 const entries=Object.entries(state.drafts);
 if(!entries.length){message('No hay cambios por enviar.');return}
 const chosen=entries.slice(0,25).map(([fileId,fields])=>({fileId,...fields}));
 const body='ELEGANCE_STUDIO_V1\n'+JSON.stringify({version:1,changes:chosen});
 const title='Elegance Studio | Guardar cambios';
 const base='https://github.com/'+OWNER+'/issues/new?title='+encodeURIComponent(title);
 const url=base+'&body='+encodeURIComponent(body);
 if(url.length<6500){
  message('Preparados '+chosen.length+' de '+entries.length+' cambios. Confirma «Submit new issue» en GitHub para guardarlos.');
  window.open(url,'_blank','noopener,noreferrer');
 }else{
  const clipboard=navigator.clipboard?.writeText(body);
  Promise.resolve(clipboard).then(()=>{message('Cambios copiados. Pega el contenido en el formulario de GitHub y pulsa «Submit new issue».');window.open(base,'_blank','noopener,noreferrer')})
    .catch(()=>{message('El navegador bloqueó el portapapeles. Utiliza Exportar copia JSON y vuelve a intentarlo.');});
 }
}
function exportDrafts(){
 const data={version:1,changes:Object.entries(state.drafts).map(([fileId,fields])=>({fileId,...fields}))};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='Elegance-Studio-cambios.json';
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),2000);
 message('Copia local descargada. Los cambios siguen pendientes de publicación.');
}
function bind(){
 $('studio-search').addEventListener('input',e=>{state.search=e.target.value.trim().toLocaleLowerCase('es-MX');state.page=0;render()});
 $('studio-status').addEventListener('change',e=>{state.status=e.target.value;state.page=0;render()});
 $('studio-category').addEventListener('change',e=>{state.category=e.target.value;state.page=0;render()});
 $('studio-reset').addEventListener('click',()=>{state.search='';state.category='';state.status='all';state.page=0;
  $('studio-search').value='';$('studio-category').value='';$('studio-status').value='all';render()});
 $('studio-grid').addEventListener('click',e=>{
  const sel=e.target.closest('[data-select]');if(sel){state.selected.has(sel.dataset.select)?state.selected.delete(sel.dataset.select):state.selected.add(sel.dataset.select);render();return}
  const edit=e.target.closest('[data-edit]');if(edit)openEditor(edit.dataset.edit);
 });
 $('studio-prev').addEventListener('click',()=>{state.page--;render();$('studio-grid').scrollIntoView({block:'start'})});
 $('studio-next').addEventListener('click',()=>{state.page++;render();$('studio-grid').scrollIntoView({block:'start'})});
 $('select-page').addEventListener('click',()=>{filter().slice(state.page*PAGE,(state.page+1)*PAGE).forEach(m=>state.selected.add(m.fileId));render()});
 $('clear-selection').addEventListener('click',()=>{state.selected.clear();render()});
 $('group-selected').addEventListener('click',()=>{
  const ids=[...state.selected];if(ids.length<2){message('Selecciona al menos dos fotos del MISMO artículo para agruparlas.');return}
  const anchor=ids[0];for(const id of ids)state.drafts[id]={...(state.drafts[id]||{}),groupId:anchor};
  state.selected.clear();saveDrafts();render();message('Se agruparon '+ids.length+' fotografías localmente. Revisa el grupo y publícalo cuando esté correcto.');
 });
 $('review-selected').addEventListener('click',()=>{
  const ids=[...state.selected];const approved=ids.filter(id=>cat(id));
  for(const id of approved)state.drafts[id]={...(state.drafts[id]||{}),category:cat(id),reviewed:true};
  state.selected.clear();saveDrafts();render();
  message('Se marcaron '+approved.length+' fotografías con categoría revisada.'+(ids.length>approved.length?' Las que no tienen categoría requieren edición individual.':''));
 });
 $('studio-edit-form').addEventListener('submit',e=>{
  e.preventDefault();const id=state.current;
  const group=$('edit-group').value.trim();
  if(group&&!state.media.some(m=>m.fileId===group)){message('Grupo inexistente. Copia el ID completo de una fotografía existente.');return}
  save(id,{
   category:$('edit-category').value||null,name:$('edit-name').value.trim()||null,brand:$('edit-brand').value.trim()||null,
   groupId:group||null,reviewed:$('edit-reviewed').checked,hidden:$('edit-hidden').checked
  });$('studio-edit').close();message('Edición local guardada. Publica los cambios cuando termines.');
 });
 $('studio-close').addEventListener('click',()=>$('studio-edit').close());
 $('studio-cancel').addEventListener('click',()=>$('studio-edit').close());
 $('studio-publish').addEventListener('click',prepareIssue);
 $('studio-export').addEventListener('click',exportDrafts);
}
function reconcile(){
 for(const [id,fields] of Object.entries(state.drafts)){
  if(!state.media.some(m=>m.fileId===id)){delete state.drafts[id];continue}
  const published=state.saved[id]||{};
  if(Object.entries(fields).every(([k,v])=>(published[k]??null)===(v===false?null:v)))delete state.drafts[id];
 }
 saveDrafts();
}
async function boot(){
 bind();state.drafts=localLoad();
 try{
  const response=await Promise.all([
   fetch('data/imagekit-media.json'),fetch('data/auto-categories.json'),
   fetch('data/ai-classifications.json'),fetch('data/catalog-curation.json'),
   fetch('data/auto-categories-summary.json')
  ]);
  if(response.some(r=>!r.ok))throw Error('No se pudieron recuperar los datos del catálogo');
  const [media,routes,predictions,curation,summary]=await Promise.all(response.map(r=>r.json()));
  if(!Array.isArray(media)||!Array.isArray(routes)||!Array.isArray(predictions)||curation?.version!==1)throw Error('Formato inesperado');
  state.media=media.filter(validPhoto).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  state.routes=new Map(routes.filter(x=>x.fileId).map(x=>[x.fileId,x]));
  state.ai=new Map(predictions.filter(x=>x.fileId).map(x=>[x.fileId,x]));
  state.saved=curation.entries||{};
  const total=state.media.length,analyzed=state.ai.size;
  const percentage=total?Math.round(analyzed/total*100):0;
  const automatic=Number(summary?.autoAssignedPhotos)||state.media.filter(m=>Boolean(route(m.fileId).category)).length;
  $('ai-progress-title').textContent=compact(analyzed)+' de '+compact(total)+' fotografías analizadas por IA ('+percentage+' %)';
  $('ai-progress-detail').textContent=compact(automatic)+' fotografías ubicadas automáticamente en categorías · '+compact(total-analyzed)+' pendientes de análisis';
  $('ai-progress-bar').setAttribute('aria-valuenow',String(percentage));
  $('ai-progress-fill').style.width=percentage+'%';
  const opts='<option value="">Todas</option>'+CATS.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
  $('studio-category').innerHTML=opts;
  $('edit-category').innerHTML='<option value="">Sin categoría confirmada</option>'+CATS.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
  reconcile();render();
  message('Panel listo. Edita fotografías y usa «Guardar en GitHub» para sincronizar tu trabajo.');
 }catch(e){message('Error al cargar: '+e.message);$('studio-count').textContent='Archivo no disponible';}
}
boot();
})();