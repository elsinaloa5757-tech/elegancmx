const {test,expect}=require('@playwright/test');

test('authentic panther 3D viewer is lazy and does not replace the catalog', async({page})=>{
 await page.route('https://sketchfab.com/models/**', route=>route.fulfill({
  status:200,contentType:'text/html',body:'<!doctype html><title>3D test model</title><p>Mocked external WebGL viewer</p>'
 }));
 await page.goto('/');
 const section=page.locator('#pantera-3d');
 await expect(section).toBeVisible();
 await expect(section.locator('iframe')).toHaveCount(0);
 await expect(section).toContainText('volumen real');
 await page.locator('#panther-3d-activate').click();
 const frame=section.locator('iframe');
 await expect(frame).toHaveCount(1);
 await expect(frame).toHaveAttribute('src',/sketchfab.com\/models\/7fca11c89cca4362a525c891a8345112\/embed/);
 await expect(frame).toHaveAttribute('title',/Pantera 3D real/);
 await expect(page.locator('#panther-3d-controls')).toBeVisible();
 await page.locator('#panther-3d-close').click();
 await expect(section.locator('iframe')).toHaveCount(0);
 await expect(page.locator('#panther-3d-activate')).toBeVisible();
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 await page.locator('#admin-header-open').click();
 await expect(page.locator('#admin-dialog')).toBeVisible();
});

test('3D stage fits compact mobile storefront and respects manual activation',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#pantera-3d')).toBeVisible();
 await expect(page.locator('#pantera-3d iframe')).toHaveCount(0);
 await expect(page.locator('#panther-3d-activate')).toBeVisible();
 const documentWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
 const viewWidth=await page.evaluate(()=>document.documentElement.clientWidth);
 expect(documentWidth).toBeLessThanOrEqual(viewWidth+1);
});
