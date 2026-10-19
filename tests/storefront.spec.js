const {test,expect}=require('@playwright/test');
test('storefront loads with original panther and navigation',async({page})=>{
 await page.goto('/');
 await expect(page).toHaveTitle(/Elegance MX/i);
 await expect(page.locator('.hero')).toBeVisible();
 await expect(page.locator('#nav button')).toHaveCount(12);
 await expect(page.locator('#search')).toBeVisible();
 await expect(page.locator('#cart')).toBeVisible();
 await expect(page.locator('#fav')).toBeVisible();
 await expect(page.locator('#wa')).toBeVisible();
 const image=await page.evaluate(async()=>{const r=await fetch('/assets/elegance-panther.png');return r.ok&&r.headers.get('content-type')?.includes('image')});
 expect(image).toBeTruthy();
});
test('empty catalog does not fabricate sellable products',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#products .product')).toHaveCount(0);
 await expect(page.locator('#empty')).toBeVisible();
 await page.locator('#cart').click();
 await expect(page.locator('#drawerItems')).toContainText('Todavía no hay artículos');
});
test('responsive mobile menu and search work',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.locator('#menu').click();
 await page.locator('#search').fill('Nike');
 await expect(page.locator('#products .product')).toHaveCount(0);
});
