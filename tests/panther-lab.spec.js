const {test,expect}=require('@playwright/test');
const path=require('node:path');
test('panther lab compares approved original and live rig without replacing store',async({page})=>{
 await page.goto('/pantera-lab.html');
 await expect(page.locator('.brand')).toHaveText('elegance');
 await expect(page.locator('.reference')).toBeVisible();
 await expect(page.locator('model-viewer[src="assets/panther/elegance-panther.glb"]')).toBeVisible();
 await expect(page.locator('#qa-score')).toHaveText('0/6');
 await page.locator('#checks input').first().check();
 await expect(page.locator('#qa-score')).toHaveText('1/6');
 await page.locator('#clear').click();
 await expect(page.locator('#qa-score')).toHaveText('0/6');
 await page.locator('#tab-source').click();
 await expect(page.locator('#reference3d')).toBeVisible();
 await expect(page.locator('#source-credit')).toBeVisible();
 await page.locator('#tab-owned').click();
 await expect(page.locator('#model')).toBeVisible();
});
test('panther lab accepts a real local GLB and audits skeleton without sending files',async({page})=>{
 await page.goto('/pantera-lab.html');
 await page.locator('#glb-upload').setInputFiles(path.join(process.cwd(),'dist/assets/panther/elegance-panther.glb'));
 await expect(page.locator('#file-metadata')).toContainText('25 huesos');
 await expect(page.locator('#file-metadata')).toContainText('5 clips');
 await expect(page.locator('#tab-upload')).toHaveAttribute('aria-pressed','true');
 const requests=[];page.on('request',r=>{if(r.method()!=='GET')requests.push(r.url())});
 await page.waitForTimeout(200);
 expect(requests).toEqual([]);
});
test('panther lab mobile layout works without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/pantera-lab.html');
 await expect(page.locator('#model')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});