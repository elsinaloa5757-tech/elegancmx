/* True 3D mesh viewer: a licensed Sketchfab model, loaded only after activation.
 * The 3D model is an actual 19k-triangle mesh; not a CSS rotation or image trick.
 * Respect author credit and do not conceal third-party branding.
 */
(()=>{
  'use strict';
  const trigger=document.getElementById('panther-3d-activate');
  const stage=document.getElementById('panther-3d-stage');
  const viewport=document.getElementById('panther-3d-viewport');
  const starter=document.getElementById('panther-3d-starter');
  const loading=document.getElementById('panther-3d-loading');
  const controls=document.getElementById('panther-3d-controls');
  const close=document.getElementById('panther-3d-close');
  if(!trigger||!stage||!viewport||!starter||!loading||!controls||!close)return;

  const src='https://sketchfab.com/models/7fca11c89cca4362a525c891a8345112/embed'
    +'?autostart=1&autospin=0.22&camera=0&dnt=1&scrollwheel=0&ui_theme=dark';
  let frame=null;

  function stop(){
    if(frame){frame.remove();frame=null}
    starter.hidden=false;
    loading.hidden=true;
    controls.hidden=true;
    stage.classList.remove('panther-3d-live');
    trigger.focus({preventScroll:true});
  }
  function start(){
    if(frame)return;
    const f=document.createElement('iframe');
    f.title='Pantera 3D real: mantén pulsado y arrastra para girarla';
    f.setAttribute('allow','autoplay; fullscreen; xr-spatial-tracking');
    f.setAttribute('allowfullscreen','');
    f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
    f.setAttribute('loading','eager');
    f.addEventListener('load',()=>{
      if(frame!==f)return;
      loading.hidden=true;
    },{once:true});
    frame=f;
    viewport.appendChild(f);
    starter.hidden=true;
    loading.hidden=false;
    controls.hidden=false;
    stage.classList.add('panther-3d-live');
    // Assign src after DOM attachment to avoid premature offscreen fetches.
    f.src=src;
  }
  trigger.addEventListener('click',start);
  close.addEventListener('click',stop);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&frame)stop();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&frame){
      // Keep state on tab switch; Sketchfab manages its own render throttling.
      loading.hidden=true;
    }
  });
})();