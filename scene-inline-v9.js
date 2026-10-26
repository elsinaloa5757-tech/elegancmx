/* Elegance V9: unobtrusive real 3D scene bridge. Zero impact on commercial data. */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const view=$('#view'),frame=$('#scene-3d-frame'),btn=$('#real3d-toggle');
if(!view||!frame||!btn)return;
const hint=view.querySelector('.overlay-top .hint');
const initialHint=hint?.innerHTML||'';
const status=$('#scene-status');
const oldStatus=status?.textContent||'';
const breatheLabel=$('#breathe')?.closest('.controlrow')?.querySelector('span');
const initialBreatheLabel=breatheLabel?.textContent||'Respiración 2.5D';
const audio=$('#roar-audio');
const footer=$('#scene-status')?.closest('.stage-footer');
const credit=document.createElement('small');credit.className='credit3d';credit.hidden=true;
credit.innerHTML='Modelo 3D: <a href="https://sketchfab.com/3d-models/black-panther-7fca11c89cca4362a525c891a8345112" target="_blank" rel="noopener noreferrer">kenchoo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>';
footer?.insertBefore(credit,footer.querySelector('.actions'));
let enabled=false,ready=false;
const post=payload=>{if(enabled&&frame.contentWindow&&frame.getAttribute('src'))frame.contentWindow.postMessage({type:'ELEGANCE_3D_COMMAND',...payload},location.origin)};
const stateValue=id=>Number($(id)?.value||0);
const presetValue=()=>$('#scene-preset')?.value||'ice';
function sync(){
 post({command:'preset',value:presetValue()});
 post({command:'exposure',value:Math.min(1.9,Math.max(.65,stateValue('#bright')/70))});
 post({command:'glow',value:Math.min(1.25,Math.max(.3,stateValue('#glow')/80))});
 post({command:'float',value:$('#float')?.getAttribute('aria-pressed')==='true'});
 if($('#play')?.getAttribute('aria-pressed')==='false')post({command:'pause'});
}
function show(mode){
 enabled=mode;
 btn.setAttribute('aria-pressed',String(mode));
 btn.textContent=mode?'▧ Vista original':'◈ Modo 3D real';
 view.classList.toggle('real-3d',mode);
 credit.hidden=!mode;
 if(breatheLabel)breatheLabel.textContent=mode?'Respiración 3D articulada':initialBreatheLabel;
 if(mode){
  ready=false;
  view.setAttribute('aria-label','Pantera GLB 3D articulada; gira la cámara con el mouse o tu dedo');
  hint.innerHTML='<span class="led"></span> <b>3D REAL</b> · PANTERA ARTICULADA';
  status.textContent='Cargando pantera GLB y showroom tridimensional…';
  frame.title='Pantera negra tridimensional con escenario de lujo azul hielo y cámara libre';
  frame.src='./scene-ice-embed.html';
 }else{
  post({command:'pause'});
  frame.removeAttribute('src'); // release WebGL/GPU resources on mobile
  ready=false;
  hint.innerHTML=initialHint;
  view.setAttribute('aria-label','Pantera fotográfica original con efectos 2.5D; perspectiva aproximada');
  status.textContent=oldStatus==='Cargando escena · composición conservada'?'Vista original conservada':oldStatus;
 }
}
btn.addEventListener('click',()=>show(!enabled));
frame.addEventListener('load',()=>{if(enabled)post({command:'identify'})});
window.addEventListener('message',e=>{
 if(!enabled||e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='ELEGANCE_3D')return;
 if(e.data.event==='iframe-ready')post({command:'identify'});
 if(e.data.event==='ready'){
  ready=!!e.data.ready;
  if(!ready)return;
  const clips=e.data.clips||[];
  status.textContent='3D real activo · 47 huesos · '+clips.length+' animaciones';
  sync();
 }
 if(e.data.event==='error'){
  status.textContent='La escena 3D no cargó; restaurando la vista original';
  show(false); // GPU/network errors must never leave the approved panel blank
 }
 if(e.data.event==='clip-missing')status.textContent='Animación no disponible en este modelo';
 if(e.data.event==='clip'&&ready)status.textContent='3D real activo · 47 huesos · '+String(e.data.name||'').replace(/_/g,' ');
});
function mirror(selector,event,fn){
 document.querySelectorAll(selector).forEach(el=>el.addEventListener(event,e=>{if(enabled)queueMicrotask(()=>fn(el,e))}));
}
mirror('[data-view]','click',el=>{
 const floatButton=$('#float');
 // A deliberately chosen camera angle must remain stationary until the user
 // explicitly re-enables the floating camera; mirror the original control.
 if(floatButton?.getAttribute('aria-pressed')==='true')floatButton.click();
 post({command:'camera',view:el.dataset.view});
});
mirror('[data-preset]','click',()=>sync());
mirror('#scene-preset','change',()=>sync());
mirror('#bright','input',()=>post({command:'exposure',value:stateValue('#bright')/70}));
mirror('#glow','input',()=>post({command:'glow',value:stateValue('#glow')/80}));
mirror('#float','click',()=>post({command:'float',value:$('#float').getAttribute('aria-pressed')==='true'}));
mirror('#breathe','click',()=>{
 if($('#breathe').getAttribute('aria-pressed')==='true')post({command:'play',clip:'idle_breathe'});
 else post({command:'pause'});
});
mirror('#play','click',()=>post({command:$('#play').getAttribute('aria-pressed')==='true'?'resume':'pause'}));
mirror('#reset','click',()=>{post({command:'reset'});sync()});
$('#roar')?.addEventListener('click',e=>{
 if(!enabled)return;
 e.stopImmediatePropagation(); // do not simultaneously deform the hidden photograph
 post({command:'play',clip:'roar_short'});
 $('#roar').setAttribute('aria-pressed','true');setTimeout(()=>$('#roar').setAttribute('aria-pressed','false'),2200);
 if(audio){audio.currentTime=0;audio.play().catch(()=>{status.textContent='Rugido 3D activo · sonido no autorizado por navegador'})}
},true);
window.addEventListener('pagehide',()=>{if(enabled)post({command:'pause'})});
document.addEventListener('visibilitychange',()=>{if(enabled)post({command:document.hidden?'pause':'resume'})});
})();
