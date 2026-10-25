const {test,expect}=require('@playwright/test');

test('showroom keeps original art and functional 3D-style controls',async({page})=>{
 await page.goto('/showroom.html');
 await expect(page.locator('.brand')).toHaveText('elegance');
 await expect(page.locator('#view')).toBeVisible();
 await page.locator('[data-view="left"]').click();
 await expect(page.locator('#camera-state')).toHaveText(/lateral/i);
 await page.locator('[data-preset="night"]').click();
 await expect(page.locator('[data-preset="night"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#play').click();
 await expect(page.locator('#play')).toHaveAttribute('aria-pressed','false');
 const img=await page.locator('#scene').evaluate(el=>{const style=getComputedStyle(el);return el.style.backgroundImage||style.backgroundImage||''});
 const asset=await page.request.get('/assets/panther-stage-desktop.jpg');expect(asset.status()).toBe(200);
 await expect(page.locator('#admin')).toBeVisible();
});

test('showroom public photo catalog filters without inventing commercial items',async({page})=>{
 await page.goto('/showroom.html');
 await page.locator('[data-panel="Catálogo"]').click();
 await expect(page.locator('#catalog-drawer')).toBeVisible();
 await expect(page.locator('#catalog-results .catalog-item').first()).toBeVisible({timeout:25000});
 await expect(page.locator('#catalog-results .catalog-item')).toHaveCount(24);
 await page.locator('#catalog-category').selectOption('Tenis');
 await expect(page.locator('#catalog-results .catalog-item').first()).toBeVisible();
 await page.locator('#catalog-results .catalog-item button').first().click();
 await expect(page.locator('#catalog-copy')).toContainText('(1)');
 await page.locator('#catalog-close').click();
 await expect(page.locator('#catalog-drawer')).toBeHidden();
});

test('showroom mobile layout has no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/showroom.html');
 await expect(page.locator('.scene-viewport')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.locator('[data-panel="Catálogo"]').click();
 await expect(page.locator('#catalog-drawer')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});