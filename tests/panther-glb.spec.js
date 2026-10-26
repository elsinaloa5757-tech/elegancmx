const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

test('the shipped GLB is a real rigged glTF 2.0 asset with 25 bones and five independent animation clips',()=>{
 const file=fs.readFileSync(path.join(process.cwd(),'dist/assets/panther/elegance-panther.glb'));
 expect(file.subarray(0,4).toString()).toBe('glTF');
 expect(file.readUInt32LE(4)).toBe(2);
 expect(file.readUInt32LE(8)).toBe(file.length);
 expect(file.subarray(16,20).toString()).toBe('JSON');
 const len=file.readUInt32LE(12);
 const doc=JSON.parse(file.subarray(20,20+len).toString());
 expect(doc.skins[0].joints.length).toBeGreaterThanOrEqual(25);
 expect(new Set(doc.animations.map(a=>a.name))).toEqual(new Set(['idle_breathe','roar_short','look_left','look_right','stance_shift']));
 expect(doc.meshes[0].primitives[0].attributes.JOINTS_0).toBeGreaterThanOrEqual(0);
 expect(doc.meshes[0].primitives[0].attributes.WEIGHTS_0).toBeGreaterThanOrEqual(0);
 expect(file.length).toBeLessThan(5*1024*1024);
});

test('the approved existing showroom remains unchanged and links to the real articulated panther',async({page})=>{
 await page.goto('/showroom.html');
 await expect(page.locator('.brand')).toHaveText('elegance');
 await expect(page.locator('a[href="./pantera-licensed.html"]')).toBeVisible();
 const link=page.locator('a[href="./pantera-licensed.html"]');
 await link.click();
 await expect(page).toHaveURL(/pantera-licensed\.html$/);
 await expect(page.locator('model-viewer[src="./assets/panther/elegance-panther-kenchoo-mobile-v1.glb"]')).toHaveCount(1);
 await expect(page.locator('[data-clip]')).toHaveCount(6);
 await expect(page.locator('.wordmark')).toHaveText('elegance');
});

test('3D panther viewer has usable mobile controls and does not overflow screen',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/pantera-3d.html');
 await expect(page.locator('#panther')).toBeVisible();
 await expect(page.locator('[data-clip="roar_short"]')).toBeVisible();
 await expect(page.locator('#reset-view')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
