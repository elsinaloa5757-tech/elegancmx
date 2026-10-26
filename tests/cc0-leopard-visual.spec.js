const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
test('visual anatomy evaluation, CC0 leopard, never deploy this draft model',async({page})=>{
  test.setTimeout(100000);
  const response=await fetch('https://www.innerscene.com/api/library/leopard-4ae8cc29/download',{signal:AbortSignal.timeout(30000)});
  if(!response.ok){console.log('CC0_VISUAL_SOURCE_UNAVAILABLE',response.status);return;}
  const glb=Buffer.from(await response.arrayBuffer());
  expect(glb.subarray(0,4).toString()).toBe('glTF');
  await page.route('**/leopard-eval.glb',async route=>route.fulfill({body:glb,contentType:'model/gltf-binary'}));
  await page.setViewportSize({width:960,height:600});
  await page.goto('/pantera-3d.html');
  await expect.poll(()=>page.evaluate(()=>Boolean(customElements.get('model-viewer'))),{timeout:20000}).toBeTruthy();
  await page.evaluate(()=>{
   const el=document.querySelector('#panther');el.setAttribute('src','/leopard-eval.glb');el.setAttribute('camera-orbit','25deg 70deg 3.4m');
   el.setAttribute('camera-target','0m 0.42m 0m');el.setAttribute('exposure','1.5');
  });
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#panther')?.loaded),{timeout:35000}).toBeTruthy();
  const meta=await page.evaluate(()=>({anim:document.querySelector('#panther').availableAnimations.length,dimensions:document.querySelector('#panther').getDimensions()?.toArray?.()}));
  console.log('CC0_VISUAL_META:',JSON.stringify(meta));
  await page.waitForTimeout(750);
  for (const [name,orbit] of [['A','25deg 70deg 3.4m'],['B','110deg 70deg 3.4m']]){
   await page.evaluate((val)=>document.querySelector('#panther').cameraOrbit=val,orbit);
   await page.waitForTimeout(700);
   const bytes=await page.locator('#panther').screenshot({type:'jpeg',quality:46});
   console.log('CC0_VISUAL_PREVIEW_'+name+'_B64:',bytes.toString('base64'));
  }
});
