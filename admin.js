(()=>{'use strict';
const HOST='https://czekazhacqaamwecjthp.supabase.co';
const KEY='sb_publishable_Z51W6iueiL_dmRdmZe6_JQ_WoSirGA3';
const API=HOST+'/functions/v1/elegance-admin', $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CAT=['Tenis','Bolsas','Ropa','Playeras','Gorras','Pantalones','Accesorios','Joyería','Relojes','Lentes','Fragancias','Calzado','Vestidos','Lencería','Cinturones','Buckets'];
const TYPES=new Set(['image/jpeg','image/png','image/webp','video/mp4','video/webm']);
const S={session:null,authorized:false,ready:false,files:[],items:[],routes:new Map(),uploading:false,cancelled:false,requests:new Set(),shown:48};
function notice(s,error=false){$('admin-message').textContent=s;$('admin-message').dataset.error=String(error)}
function store(){try{if(S.session)sessionStorage.setItem('elegance_admin_auth_v1',JSON.stringify(S.session));else sessionStorage.removeItem('elegance_admin_auth_v1')}catch{}}
async function auth(path,payload){
 const r=await fetch(HOST+'/auth/v1/'+path,{method:'POST',headers:{apikey:KEY,'content-type':'application/json'},body:JSON.stringify(payload)});
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(j.error_description||j.msg||j.message||'No se pudo autenticar');
 return j;
}
async function api(action,params={},retry=true){
 if(!S.session?.access_token)throw Error('Debes iniciar sesión');
 const r=await fetch(API,{method:'POST',headers:{apikey:KEY,authorization:'Bearer '+S.session.access_token,'content-type':'application/json'},body:JSON.stringify({action,...params})});
 const j=await r.json().catch(()=>({}));
 if(r.status===401&&retry&&S.session.refresh_token){
  S.session=await auth('token?grant_type=refresh_token',{refresh_token:S.session.refresh_token});store();
  return api(action,params,false);
 }
 if(!r.ok||j.ok===false)throw Error(j.error||'La operación no se completó');
 return j;
}
function signout(){
 S.session=null;S.authorized=false;S.ready=false;store();
 $('admin-workspace').hidden=true;$('admin-auth-screen').hidden=false;
 notice('Sesión cerrada');
}
async function enter(){
 const a=await api('status');
 if(!a.allowed){
  S.authorized=false;$('admin-workspace').hidden=true;$('admin-auth-screen').hidden=false;
  notice('Correo verificado, pero sin permiso administrativo. El propietario debe autorizar esta dirección de correo.',true);
  return;
 }
 S.authorized=true;S.ready=!!a.imagekitReady;
 $('admin-workspace').hidden=false;$('admin-auth-screen').hidden=true;
 $('admin-session-email').textContent=a.email;
 $('admin-upload').disabled=!S.ready||!S.files.length;
 notice(S.ready?'Acceso administrativo verificado. Puedes editar y subir mercancía.':'Acceso autorizado. La conexión protegida a ImageKit aún no se ha completado; la edición de mercancía sigue disponible.',!S.ready);
 await load();
}
function open(){
 $('admin-dialog').showModal();
 if(S.session)enter().catch(e=>{signout();notice(e.message,true)});
 else notice('Accede mediante correo y contraseña de Elegance MX.');
}
async function login(e){
 e.preventDefault();$('admin-signin').disabled=true;
 try{
  S.session=await auth('token?grant_type=password',{email:$('admin-email').value.trim(),password:$('admin-password').value});
  $('admin-password').value='';store();await enter();
 }catch(e){notice(e.message,true)}
 finally{$('admin-signin').disabled=false}
}
async function signup(){
 const email=$('admin-email').value.trim(),password=$('admin-password').value;
 if(!email||password.length<8){notice('Introduce tu correo y una contraseña de al menos 8 caracteres.',true);return}
 $('admin-signup').disabled=true;
 try{
  const result=await auth('signup',{email,password});
  $('admin-password').value='';
  if(result.access_token){S.session=result;store();await enter();}
  else notice('Revisa tu correo para verificar la cuenta. Después inicia sesión. El acceso administrativo requiere aprobación.');
 }catch(e){notice(e.message,true)}
 finally{$('admin-signup').disabled=false}
}
function queue(files){
 if(S.uploading)return;
 const merged=S.files.slice(),seen=new Set(merged.map(f=>f.name+':'+f.size+':'+f.lastModified));
 const incoming=[...files];let invalid=0;
 for(const f of incoming){
  if(!TYPES.has(f.type)){invalid++;continue}
  const key=f.name+':'+f.size+':'+f.lastModified;
  if(!seen.has(key)){merged.push(f);seen.add(key)}
 }
 if(merged.length>250){notice('Máximo 250 fotos y videos por lote. Selecciona menos archivos.',true);return}
 S.files=merged;
 $('admin-count-batch').textContent=merged.length+'/250';
 $('admin-selected-size').textContent=merged.length+' archivos · '+(merged.reduce((s,f)=>s+f.size,0)/1048576).toFixed(1)+' MB originales';
 $('admin-queue').textContent=merged.slice(0,12).map(f=>f.name).join(' · ')+(merged.length>12?' · +'+(merged.length-12)+' más':'');
 $('admin-upload').disabled=!S.ready||!S.authorized||!merged.length;
 notice(invalid?invalid+' archivos omitidos por formato incompatible.':merged.length+' archivos listos para subir.',invalid>0);
}
async function digest(file){
 const d=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
 return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function compress(file){
 let bmp=null,src=null,blobUrl=null,w=0,h=0;
 try{
  if('createImageBitmap' in window){
   bmp=await createImageBitmap(file);src=bmp;w=bmp.width;h=bmp.height;
  }else{
   blobUrl=URL.createObjectURL(file);src=new Image();
   await new Promise((ok,no)=>{src.onload=ok;src.onerror=()=>no(Error('Imagen ilegible'));src.src=blobUrl});
   w=src.naturalWidth;h=src.naturalHeight;
  }
  if(!w||!h)throw Error('Imagen no válida');
  let max=1200,q=.66,compressed;
  for(let i=0;i<6;i++){
   const scale=Math.min(1,max/Math.max(w,h));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx)throw Error('Compresión no compatible');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(src,0,0,canvas.width,canvas.height);
   compressed=await new Promise((ok,no)=>canvas.toBlob(b=>b?ok(b):no(Error('Falló la compresión')),'image/webp',q));
   if(compressed.size<=250000)break;
   max=Math.round(max*.86);q=Math.max(.44,q-.045);
  }
  if(!TYPES.has(compressed.type))throw Error('El navegador no pudo generar una imagen compatible');
  const ext=compressed.type==='image/webp'?'webp':compressed.type==='image/png'?'png':'jpg';
  const name=(file.name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,65)||'elegance')+'.'+ext;
  return new File([compressed],name,{type:compressed.type});
 }finally{if(bmp)bmp.close();if(blobUrl)URL.revokeObjectURL(blobUrl)}
}
async function checkVideo(file){
 if(file.size>25*1048576)throw Error('Video superior a 25 MB; debes reducirlo antes de cargar.');
 const uri=URL.createObjectURL(file);
 try{
  const video=document.createElement('video');video.preload='metadata';video.src=uri;
  const duration=await Promise.race([
   new Promise((ok,no)=>{video.onloadedmetadata=()=>ok(video.duration);video.onerror=()=>no(Error('Video ilegible'))}),
   new Promise((_,no)=>setTimeout(()=>no(Error('No se pudo verificar duración del video')),12000))
  ]);
  video.removeAttribute('src');video.load();
  if(!Number.isFinite(duration)||duration>30)throw Error('Video de más de 30 segundos');
 }finally{URL.revokeObjectURL(uri)}
}
async function uploadOne(file){
 if(S.cancelled)throw Error('Lote detenido');
 if(file.size>40*1048576)throw Error('Archivo original mayor de 40 MB');
 const sha256=await digest(file);
 const exists=await api('check',{sha256});
 if(exists.duplicate)return {duplicate:true,name:file.name};
 const ready=file.type.startsWith('image/')?await compress(file):file;
 if(file.type.startsWith('video/'))await checkVideo(file);
 if(S.cancelled)throw Error('Lote detenido');
 const credentials=await api('upload-auth',{mime:ready.type,bytes:ready.size});
 const form=new FormData();
 form.append('file',ready);form.append('fileName',ready.name);form.append('folder',credentials.folder);
 form.append('publicKey',credentials.publicKey);form.append('token',credentials.token);
 form.append('signature',credentials.signature);form.append('expire',String(credentials.expire));form.append('useUniqueFileName','true');
 const controller=new AbortController();S.requests.add(controller);
 let response;
 try{response=await fetch('https://upload.imagekit.io/api/v1/files/upload',{method:'POST',body:form,signal:controller.signal})}
 finally{S.requests.delete(controller)}
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.fileId||!data.url)throw Error(data.message||'ImageKit rechazó el archivo');
 const reg=await api('register',{fileId:data.fileId,url:data.url,sha256,filename:file.name,mime:ready.type,bytes:ready.size});
 return {name:file.name,bytes:ready.size,id:reg.item.id};
}
async function uploadBatch(){
 if(!S.authorized||!S.ready||!S.files.length||S.uploading)return;
 const batch=[...S.files];S.cancelled=false;S.uploading=true;
 $('admin-upload').disabled=true;$('admin-clear-files').disabled=true;$('admin-cancel-upload').hidden=false;
 $('admin-upload-progress').hidden=false;$('admin-upload-progress').value=0;
 let index=0,finished=0,ok=0,dup=0,bytes=0;const fails=[];
 async function worker(){
  while(!S.cancelled&&index<batch.length){
   const file=batch[index++];
   try{const r=await uploadOne(file);if(r.duplicate)dup++;else{ok++;bytes+=r.bytes;}}
   catch(e){fails.push({file,error:e.message})}
   finished++;$('admin-count-uploaded').textContent=String(ok);
   $('admin-upload-progress').value=Math.round(100*finished/batch.length);
   $('admin-upload-progress-text').textContent=finished+'/'+batch.length;
   if(fails.length)$('admin-queue').textContent=fails.slice(-4).map(x=>x.file.name+': '+x.error).join(' | ');
  }
 }
 try{
  await Promise.all(Array.from({length:Math.min(3,batch.length)},worker));
  notice(ok+' subidos · '+dup+' duplicados · '+fails.length+' errores · '+(bytes/1048576).toFixed(1)+' MB guardados.',!!fails.length);
  S.files=fails.map(x=>x.file);$('admin-files').value='';
  if(ok){await load();window.dispatchEvent(new Event('elegance:catalog-refresh'))}
 }catch(e){notice(e.message,true)}
 finally{
  S.uploading=false;$('admin-cancel-upload').hidden=true;$('admin-clear-files').disabled=false;queue([]);
 }
}
function norm(x){return {id:x.id||null,fileId:x.imagekit_file_id||x.fileId,
 url:x.url,mime:x.mime,filename:x.filename||x.name||'Imagen ImageKit',title:x.title||'',brand:x.brand||'',
 category:x.category||'',description:x.description||'',price:x.price??null,stock:x.stock??null,
 visible:x.visible!==false,createdAt:x.created_at||x.createdAt||'',reviewed:!!x.id};}
async function load(){
 const [live,raw,routes]=await Promise.all([api('list'),
  fetch('data/imagekit-media.json').then(r=>r.json()),
  fetch('data/auto-categories.json').then(r=>r.json())
 ]);
 S.routes=new Map(routes.filter(x=>x.fileId).map(x=>[x.fileId,x.category]));
 const existing=live.items.map(norm),seen=new Set(existing.map(x=>x.fileId));
 const historic=raw.filter(x=>/^(image|video)\//.test(x.mime||'')&&
  /^https:\/\/ik\.imagekit\.io\/elegancemx\/elegance\/products\//.test(x.url)&&!seen.has(x.fileId)).map(norm);
 S.items=[...existing,...historic];
 $('admin-count-files').textContent=S.items.length.toLocaleString('es-MX');
 S.shown=48;render();
}
function render(){
 const query=$('admin-media-search').value.toLowerCase().trim();
 const match=S.items.filter(x=>[x.filename,x.title,x.brand,x.category,x.fileId,S.routes.get(x.fileId)].join(' ').toLowerCase().includes(query));
 $('admin-media-grid').innerHTML=match.slice(0,S.shown).map(x=>
  '<article class="admin-media-card" data-id="'+esc(x.fileId)+'">'+
  (x.mime.startsWith('video/')?'<video preload="none" muted src="'+esc(x.url)+'"></video>':'<img loading="lazy" src="'+esc(x.url)+'" alt="">')+
  '<div class="admin-media-copy"><strong>'+esc(x.title||x.filename)+'</strong>'+
  '<small>'+esc(x.category||S.routes.get(x.fileId)||'Por clasificar')+' · '+esc(x.fileId.slice(-9))+'</small>'+
  '<small class="'+(x.visible?'':'is-hidden')+'">'+(x.visible?'Visible':'Oculto')+(x.reviewed?' · Revisado':' · Histórico')+'</small>'+
  '<button type="button" data-edit-admin="'+esc(x.fileId)+'">Editar artículo</button></div></article>').join('');
 $('admin-more').hidden=S.shown>=match.length;
}
async function edit(fileId){
 const x=S.items.find(a=>a.fileId===fileId);
 const target=[...$('admin-media-grid').querySelectorAll('.admin-media-card')].find(a=>a.dataset.id===fileId);
 if(!x||!target)return;
 for(const old of $('admin-media-grid').querySelectorAll('.admin-edit-form'))old.remove();
 const form=document.createElement('form');form.className='admin-edit-form';
 form.innerHTML='<div class="admin-edit-fields">'+
 '<label class="wide">Nombre<input name="title" maxlength="150" value="'+esc(x.title)+'" placeholder="Sin confirmar"></label>'+
 '<label>Categoría<select name="category"><option value="">Por clasificar</option>'+CAT.map(c=>'<option value="'+esc(c)+'"'+(c===x.category?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label>'+
 '<label>Marca<input name="brand" maxlength="150" value="'+esc(x.brand)+'"></label>'+
 '<label>Precio MXN<input name="price" type="number" min="0" step="0.01" value="'+(x.price??'')+'"></label>'+
 '<label>Existencias<input name="stock" type="number" min="0" step="1" value="'+(x.stock??'')+'"></label>'+
 '<label class="wide">Descripción<textarea name="description" maxlength="1500">'+esc(x.description)+'</textarea></label>'+
 '<label class="checkbox-field wide"><input name="visible" type="checkbox"'+(x.visible?' checked':'')+'> Visible en tienda</label>'+
 '</div><button type="submit" class="admin-primary">Guardar cambios</button>';
 target.append(form);
 form.addEventListener('submit',async e=>{
  e.preventDefault();const btn=form.querySelector('button[type=submit]');btn.disabled=true;
  const fd=new FormData(form);
  try{
   let id=x.id;
   if(!id){const a=await api('adopt',{fileId:x.fileId,url:x.url,mime:x.mime,filename:x.filename});id=a.item.id;}
   const r=await api('update',{id,title:fd.get('title'),category:fd.get('category'),brand:fd.get('brand'),
    price:fd.get('price')||null,stock:fd.get('stock')||null,
    description:fd.get('description'),visible:fd.has('visible')});
   Object.assign(x,norm(r.item));render();notice('Cambios guardados. Puedes seguir editando mercancía.');
   window.dispatchEvent(new Event('elegance:catalog-refresh'));
  }catch(err){notice(err.message,true);btn.disabled=false}
 });
}
function bind(){
 $('admin-nav-open').addEventListener('click',open);
 $('admin-footer-open').addEventListener('click',open);
 $('admin-close').addEventListener('click',()=>$('admin-dialog').close());
 $('admin-login-form').addEventListener('submit',login);
 $('admin-signup').addEventListener('click',signup);
 $('admin-signout').addEventListener('click',signout);
 $('admin-files').addEventListener('change',e=>queue(e.target.files));
 for(const event of ['dragenter','dragover'])$('admin-dropzone').addEventListener(event,e=>{e.preventDefault();$('admin-dropzone').classList.add('drag-over')});
 for(const event of ['dragleave','drop'])$('admin-dropzone').addEventListener(event,e=>{e.preventDefault();$('admin-dropzone').classList.remove('drag-over');if(event==='drop'&&e.dataTransfer?.files?.length)queue(e.dataTransfer.files)});
 $('admin-upload').addEventListener('click',uploadBatch);
 $('admin-cancel-upload').addEventListener('click',()=>{S.cancelled=true;for(const c of S.requests)c.abort();notice('Deteniendo cargas activas...')});
 $('admin-clear-files').addEventListener('click',()=>{if(S.uploading)return;S.files=[];$('admin-files').value='';queue([])});
 $('admin-refresh').addEventListener('click',()=>load().catch(e=>notice(e.message,true)));
 $('admin-media-search').addEventListener('input',()=>{S.shown=48;render()});
 $('admin-more').addEventListener('click',()=>{S.shown+=48;render()});
 $('admin-media-grid').addEventListener('click',e=>{const b=e.target.closest('[data-edit-admin]');if(b)edit(b.dataset.editAdmin)});
}
try{S.session=JSON.parse(sessionStorage.getItem('elegance_admin_auth_v1')||'null')}catch{S.session=null}
bind();
})();