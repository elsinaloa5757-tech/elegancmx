(()=>{'use strict';
/** Elegance MX administration: Supabase email/password and securely signed ImageKit browser uploads.
 * Credentials and ImageKit private keys never go into the public storefront. */
const BASE='https://czekazhacqaamwecjthp.supabase.co';
const PUB='sb_publishable_Z51W6iueiL_dmRdmZe6_JQ_WoSirGA3';
const MAX=250,VIDEO_MAX=25*1024*1024;
const CATS=['Tenis','Ropa','Bolsas','Gorras','Accesorios','Pantalones','Calzado','Relojes','Lentes','Fragancias','Joyería','Playeras','Lencería','Vestidos','Cinturones','Buckets','Otros'];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const panelButton=document.createElement('button');panelButton.id='admin-open';panelButton.type='button';
panelButton.className='icon-button admin-header-button';panelButton.setAttribute('aria-label','Abrir administrador');
panelButton.innerHTML='<span aria-hidden="true">⚙</span><small>Administrador</small>';
document.querySelector('.header-actions')?.append(panelButton);
let session=null,user=null,selected=[],running=false,stopped=false,ready=false,tokens=[],pendingSign=null;
const status=(msg,error=false)=>{if(!$('admin-status'))return;$('admin-status').textContent=msg;$('admin-status').classList.toggle('admin-error',error)};
const progress=(done,total,msg)=>{$('admin-upload-progress').value=total?100*done/total:0;$('admin-upload-detail').textContent=msg};
async function api(url,{method='GET',body,auth=false,prefer}={}){
 const headers={apikey:PUB};
 if(auth){await refresh();headers.authorization='Bearer '+session.access_token}
 if(body!==undefined)headers['content-type']='application/json';
 if(prefer)headers.Prefer=prefer;
 let response;
 try{response=await fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'})}
 catch{throw Error('No hay conexión con el servidor. Comprueba tu Internet.')}
 const json=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(json?.msg||json?.error_description||json?.message||json?.error||'Error del servidor ('+response.status+')');
 return json;
}
const keep=s=>{session=s;sessionStorage.setItem('elegance_admin_session_v1',JSON.stringify(s))};
async function refresh(){
 if(!session)throw Error('Necesitas iniciar sesión.');
 if(session.expires_at>Date.now()/1000+60)return;
 if(!session.refresh_token)throw Error('La sesión terminó. Vuelve a iniciar sesión.');
 keep(await api(BASE+'/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}}));
}
const privileged=(action,extra={})=>api(BASE+'/functions/v1/elegance-admin-upload',{method:'POST',body:{action,...extra},auth:true});
const db=(path,options={})=>api(BASE+'/rest/v1/'+path,{...options,auth:true});
function logout(){
 session=null;user=null;selected=[];tokens=[];
 sessionStorage.removeItem('elegance_admin_session_v1');
 $('admin-signin').hidden=false;$('admin-private').hidden=true;
 $('admin-password').value='';$('admin-file-input').value='';
 $('admin-selected').textContent='0 archivos seleccionados';
}
async function loadAdmin(){
 const config=await privileged('status');
 ready=config.imagekitConfigured===true;
 $('admin-signin').hidden=true;$('admin-private').hidden=false;
 $('admin-session-label').textContent='Acceso de administrador · '+(user?.email||'Elegance');
 $('admin-start-upload').disabled=!ready||!selected.length;
 if(!ready)status('Cuenta autorizada. Falta configurar IMAGEKIT_PUBLIC_KEY e IMAGEKIT_PRIVATE_KEY como secretos de la función en Supabase para activar las subidas reales.',true);
 else status('Acceso correcto. Las fotografías se comprimirán y subirán directamente a ImageKit.');
 await listRecords();
}
async function login(email,password){
 const result=await api(BASE+'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
 if(!result?.user?.id||!result?.access_token)throw Error('No se obtuvo una sesión de usuario válida.');
 keep(result);user=result.user;
 try{await loadAdmin()}catch(e){logout();throw e}
}
async function restore(){
 if(!sessionStorage.getItem('elegance_admin_session_v1'))return;
 try{
  session=JSON.parse(sessionStorage.getItem('elegance_admin_session_v1'));
  await refresh();user=await api(BASE+'/auth/v1/user',{auth:true});
  await loadAdmin();
 }catch{logout()}
}
async function choose(files){
 if(running){status('Espera a que termine el lote anterior.',true);return}
 const list=Array.from(files||[]);
 if(!list.length)return;
 if(list.length>MAX){status('Máximo 250 imágenes y videos por selección. Elegiste '+list.length+'.',true);return}
 if(list.some(f=>!(f.type.startsWith('image/')||f.type.startsWith('video/')))){status('Selecciona solamente imágenes y videos.',true);return}
 if(list.some(f=>f.type.startsWith('video/')&&f.size>VIDEO_MAX)){status('Hay videos de más de 25 MB. Comprímelos antes de subirlos.',true);return}
 selected=list;$('admin-selected').textContent=list.length+' archivos · '+(list.reduce((x,f)=>x+f.size,0)/1048576).toFixed(1)+' MB originales';
 $('admin-start-upload').disabled=!ready;
 progress(0,list.length,'Preparado. La compresión sucede en tu dispositivo, no en Cloudflare.');
 status('');
}
async function compress(file){
 if(!file.type.startsWith('image/'))return file;
 if(file.type==='image/svg+xml')throw Error('SVG no admitido');
 let bitmap;
 try{bitmap=await createImageBitmap(file)}catch{throw Error('Tu navegador no puede abrir esta fotografía')}
 const canvas=document.createElement('canvas'),limit=1200;
 const factor=Math.min(1,limit/Math.max(bitmap.width,bitmap.height));
 canvas.width=Math.max(1,Math.round(bitmap.width*factor));
 canvas.height=Math.max(1,Math.round(bitmap.height*factor));
 canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);
 bitmap.close();
 const encode=q=>new Promise((yes,no)=>canvas.toBlob(blob=>blob?yes(blob):no(Error('No se pudo comprimir')),'image/webp',q));
 let blob=await encode(.64);
 if(blob.size>350000){const smaller=await encode(.49);if(smaller.size<blob.size)blob=smaller}
 if(blob.size>file.size&&file.type==='image/webp')return file;
 return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'});
}
async function getSignature(){
 if(!tokens.length){
  if(!pendingSign)pendingSign=privileged('sign',{count:10}).finally(()=>{pendingSign=null});
  const resp=await pendingSign;
  if(!tokens.length)tokens.push(...resp.tokens.map(t=>({...t,publicKey:resp.publicKey,folder:resp.folder,uploadUrl:resp.uploadUrl})));
 }
 const t=tokens.shift();
 if(!t||t.expire<Date.now()/1000+30){tokens=[];return getSignature()}
 return t;
}
async function sendOne(file){
 const optimized=await compress(file);
 const sign=await getSignature();
 const basename=file.name.replace(/\.[^.]+$/,'').replace(/[^a-z0-9_.-]/gi,'_').slice(0,60)||'item';
 const ext=optimized.type==='image/webp'?'.webp':((/\.[a-zA-Z0-9]{1,8}$/.exec(optimized.name)||['.bin'])[0]);
 const name='el_'+crypto.randomUUID().slice(0,10)+'_'+basename+ext;
 const body=new FormData();
 body.append('file',optimized,name);body.append('fileName',name);
 body.append('publicKey',sign.publicKey);body.append('token',sign.token);
 body.append('signature',sign.signature);body.append('expire',String(sign.expire));
 body.append('folder',sign.folder||'/elegance/products');
 body.append('useUniqueFileName','true');
 const response=await fetch(sign.uploadUrl,{method:'POST',body});
 const uploaded=await response.json().catch(()=>({}));
 if(!response.ok||!uploaded.fileId||!uploaded.url)throw Error(uploaded?.message||'ImageKit rechazó el archivo.');
 if(!uploaded.url.startsWith('https://ik.imagekit.io/elegancemx/'))throw Error('La cuenta de ImageKit respondió con una ruta inesperada.');
 await db('elegance_uploaded_media?on_conflict=file_id',{
  method:'POST',prefer:'resolution=merge-duplicates,return=minimal',
  body:{file_id:uploaded.fileId,file_url:uploaded.url,filename:file.name.slice(0,180),
   mime_type:optimized.type||file.type,bytes:optimized.size,uploaded_by:user.id,
   title:'',brand:'',category:'',visible:false,reviewed:false}
 });
 return file.size-optimized.size;
}
async function start(){
 if(running||!selected.length)return;
 if(!ready){status('Aún falta conectar las claves de ImageKit a Supabase.',true);return}
 running=true;stopped=false;tokens=[];
 let idx=0,done=0,success=0,saved=0;const errors=[],files=selected.slice();
 $('admin-start-upload').disabled=true;$('admin-cancel-upload').disabled=false;
 progress(0,files.length,'Comprimiendo y transfiriendo a ImageKit…');
 async function worker(){
  while(idx<files.length&&!stopped){
   const file=files[idx++];
   try{saved+=await sendOne(file);success++}catch(e){errors.push(file.name+': '+String(e.message||e))}
   done++;
   progress(done,files.length,done+'/'+files.length+' procesados · '+success+' en ImageKit · '+errors.length+
    ' errores · '+Math.max(0,saved/1048576).toFixed(1)+' MB ahorrados');
  }
 }
 await Promise.all(Array.from({length:Math.min(3,files.length)},worker));
 running=false;selected=[];$('admin-file-input').value='';
 $('admin-selected').textContent='0 archivos seleccionados';
 $('admin-cancel-upload').disabled=true;
 status(success+' archivos subidos a ImageKit como borradores. '+(errors.length?errors.length+' errores: '+errors.slice(0,2).join('; '):'Sin errores.')+
 (stopped?' Lote detenido.':''),errors.length>0);
 await listRecords();
}
const opts='<option value="">Por clasificar</option>'+CATS.map(x=>'<option>'+x+'</option>').join('');
async function listRecords(){
 try{
 const rows=await db('elegance_uploaded_media?select=id,file_id,file_url,filename,mime_type,title,brand,category,notes,visible,reviewed,created_at&order=created_at.desc&limit=80');
 const list=$('admin-media-list');
 list.innerHTML=rows.length?rows.map(row=>'<form class="admin-media-row" data-media-id="'+esc(row.id)+'">'+
  (row.mime_type.startsWith('image/')?'<img loading="lazy" src="'+esc(row.file_url)+'" alt="'+esc(row.filename)+'">':
    '<video preload="metadata" controls src="'+esc(row.file_url)+'"></video>')+
  '<div class="admin-media-fields"><strong>'+esc(row.filename)+'</strong>'+
   '<input name="title" placeholder="Nombre del artículo" maxlength="160" value="'+esc(row.title)+'">'+
   '<input name="brand" placeholder="Marca (verificada)" maxlength="100" value="'+esc(row.brand)+'">'+
   '<select name="category">'+opts+'</select>'+
   '<input name="notes" placeholder="Notas, tallas o detalles" maxlength="500" value="'+esc(row.notes)+'">'+
   '<div class="admin-flags"><label><input type="checkbox" name="reviewed" '+(row.reviewed?'checked':'')+'> Revisada</label>'+
   '<label><input type="checkbox" name="visible" '+(row.visible?'checked':'')+'> Mostrar en tienda</label></div>'+
   '<button type="submit" class="admin-primary">Guardar cambios</button></div></form>').join(''):
   '<p>Las fotografías que subas aparecerán aquí para que las revises.</p>';
 rows.forEach((row,i)=>{const sel=list.querySelectorAll('select[name="category"]')[i];if(sel)sel.value=row.category||''});
 }catch(e){status('No fue posible consultar los archivos: '+e.message,true)}
}
async function saveRecord(form){
 const id=form.dataset.mediaId;
 const data=new FormData(form);
 const cat=String(data.get('category')||'');
 const visible=data.has('visible'),reviewed=data.has('reviewed');
 if(visible&&!reviewed)throw Error('Primero marca el artículo como revisado.');
 if(visible&&!cat)throw Error('Selecciona una categoría antes de publicar.');
 await db('elegance_uploaded_media?id=eq.'+encodeURIComponent(id),{
  method:'PATCH',prefer:'return=minimal',
  body:{title:String(data.get('title')||'').trim(),category:cat,
   brand:String(data.get('brand')||'').trim(),
   notes:String(data.get('notes')||'').trim(),
   reviewed,visible,updated_at:new Date().toISOString()}
 });
 status('Cambios guardados; el catálogo público se actualizará cuando se recargue.');
}
async function init(){
 try{
 const response=await fetch('admin-panel.html',{cache:'no-store'});
 if(!response.ok)throw Error('Administrador no disponible');
 const wrapper=document.createElement('div');
 wrapper.innerHTML=await response.text();
 document.body.append(...wrapper.children);
 $('admin-open').addEventListener('click',async()=>{
  $('elegance-admin-modal').showModal();
  if(!session)await restore();
 });
 $('admin-close').addEventListener('click',()=>$('elegance-admin-modal').close());
 $('admin-signin').addEventListener('submit',async ev=>{
  ev.preventDefault();status('Verificando acceso…');
  try{await login($('admin-email').value.trim(),$('admin-password').value)}
  catch(error){status('No fue posible ingresar: '+error.message,true)}
 });
 $('admin-signout').addEventListener('click',()=>{logout();status('Sesión cerrada')});
 $('admin-file-input').addEventListener('change',ev=>choose(ev.target.files));
 $('admin-dropzone').addEventListener('dragover',ev=>{ev.preventDefault();ev.currentTarget.classList.add('is-over')});
 $('admin-dropzone').addEventListener('dragleave',ev=>ev.currentTarget.classList.remove('is-over'));
 $('admin-dropzone').addEventListener('drop',ev=>{ev.preventDefault();ev.currentTarget.classList.remove('is-over');choose(ev.dataTransfer.files)});
 $('admin-start-upload').addEventListener('click',start);
 $('admin-cancel-upload').addEventListener('click',()=>{stopped=true;status('Deteniendo cuando terminen los archivos en curso…')});
 $('admin-refresh').addEventListener('click',listRecords);
 $('admin-media-list').addEventListener('submit',async ev=>{
  if(!ev.target.matches('.admin-media-row'))return;
  ev.preventDefault();const button=ev.target.querySelector('button[type=submit]');button.disabled=true;
  try{await saveRecord(ev.target)}catch(e){status(e.message,true)}finally{button.disabled=false}
 });
 }catch(e){panelButton.title='No se pudo cargar el administrador';panelButton.disabled=true}
}
init();
})();