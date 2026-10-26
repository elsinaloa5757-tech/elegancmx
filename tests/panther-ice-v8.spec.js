const {test,expect}=require('@playwright/test');
const path=require('node:path'),fs=require('node:fs');
const dst=path.join(process.cwd(),'dist/assets/panther');
const clips=['walk_original','idle_breathe','roar_short','look_left','look_right','stance_shift'];
test('V8 files preserve 47 bone rig and expose full 3D gallery geometry',()=>{
 for(const name of ['elegance-panther-ice-gallery-v8.glb','elegance-panther-obsidian-v8.glb']){
 const b=fs.readFileSync(path.join(dst,name));expect(b.subarray(0,4).toString()).toBe('glTF');
 expect(b.readUInt32LE(8)).toBe(b.length);const len=b.readUInt32LE(12);
 const doc=JSON.parse(b.subarray(20,20+len).toString());expect(doc.skins[0].joints.length).toBe(47);
 expect(doc.animations.map(a=>a.name)).toEqual(clips);
 if(name.includes('gallery'))expect(doc.scenes[doc.scene].nodes.length).toBeGreaterThan(20);
 else expect(doc.scenes[doc.scene].nodes.length).toBe(1);
 }
});
test('V8 web viewer can load cat and actual ice gallery scene, change clips, and preserve original store',async({page})=>{
 test.setTimeout(100000);
 await page.route('**/assets/panther/elegance-panther-*-v8.glb',async route=>{
  const name=route.request().url().split('/').pop();await route.fulfill({path:path.join(dst,name),contentType:'model/gltf-binary'});
 });
 await page.goto('/pantera-ice-v8.html');
 await expect(page.locator('.wordmark')).toHaveText('elegance');
 await expect.poll(()=>page.evaluate(()=>!!customElements.get('model-viewer')),{timeout:30000}).toBeTruthy();
 await expect.poll(()=>page.evaluate(()=>document.querySelector('#panther').loaded),{timeout:40000}).toBeTruthy();
 await expect(page.locator('#model-state')).toContainText('47 huesos');
 const names=await page.locator('#panther').evaluate(el=>[...el.availableAnimations]);expect(names).toEqual(expect.arrayContaining(clips));
 const shot=await page.locator('.scene').screenshot({type:'jpeg',quality:58});console.log('V8_ICE_SCENE_SCREENSHOT_BASE64:',shot.toString('base64'));
 await page.locator('[data-clip="roar_short"]').click();await expect.poll(()=>page.locator('#panther').evaluate(el=>el.animationName)).toBe('roar_short');
 await page.locator('[data-scene="solo"]').click();await expect.poll(()=>page.evaluate(()=>document.querySelector('#panther').loaded),{timeout:40000}).toBeTruthy();
 await expect(page.locator('#stage-label')).toHaveText('ANATOMÍA 3D');
 await page.locator('[data-clip="look_left"]').click();await expect.poll(()=>page.locator('#panther').evaluate(el=>el.animationName)).toBe('look_left');
});
test('V8 mobile has accessible controls without overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/pantera-ice-v8.html');
 await expect(page.locator('#panther')).toBeVisible();
 await expect(page.locator('[data-clip]')).toHaveCount(6);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
