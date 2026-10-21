const {test,expect}=require('@playwright/test');

test('3D scene preserves the real panther and never obstructs the storefront',async({page})=>{
 await page.goto('/');
 const scene=page.locator('.hero-depth');
 await expect(scene).toHaveCount(1);
 await expect(scene).toHaveAttribute('aria-hidden','true');
 await expect(scene).toHaveCSS('pointer-events','none');
 const background=await page.locator('.hero').evaluate(el=>getComputedStyle(el).backgroundImage);
 expect(background).toContain('elegance-panther.png');
 await expect(page.locator('.hero-copy .brand-script')).toContainText('elegance');
 await page.locator('.hero [data-target="browse"]').click();
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 await page.locator('#admin-header-open').click();
 await expect(page.locator('#admin-dialog')).toBeVisible();
 await page.locator('#admin-close').click();
});

test('desktop pointer creates reversible card depth without replacing actual images',async({page})=>{
 await page.goto('/');
 const card=page.locator('#product-grid .catalog-card').first();
 await card.scrollIntoViewIfNeeded();
 await card.hover();
 await expect(card).toHaveClass(/luxury-tilt/);
 await expect(card.locator('.catalog-photo img')).toHaveAttribute('src',/imagekit/);
 await page.mouse.move(1,1);
 await expect(card).not.toHaveClass(/luxury-tilt/);
});

test('mobile and reduced motion keep navigation and content usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('.hero-depth')).toBeVisible();
 await expect(page.locator('.hero-depth-orbit-outer')).toHaveCSS('animation-name','none');
 await expect(page.locator('.hero')).toBeVisible();
 const overflow=await page.evaluate(()=>({
   document:document.documentElement.scrollWidth,
   viewport:document.documentElement.clientWidth
 }));
 expect(overflow.document).toBeLessThanOrEqual(overflow.viewport+1);
 await page.locator('#side-nav [data-nav="Tenis"]').click();
 await expect(page.locator('#browse-title')).toContainText('Tenis');
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
});
