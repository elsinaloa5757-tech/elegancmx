const {test,expect}=require('@playwright/test');
test('reference-like compact mobile: fixed sidebar, 7 brands, 3+3 photo categories, panther and promos',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 await expect(page.locator('#side-nav')).toBeVisible();
 await expect(page.locator('.mobile-tabbar')).toBeHidden();
 await expect(page.locator('#brand-rail .brand-card')).toHaveCount(7);
 await expect(page.locator('#category-grid .category-tile')).toHaveCount(6);
 await expect(page.locator('#category-grid [data-category="Combos"]')).toHaveCount(0);
 await expect(page.locator('#category-grid [data-category="Ediciones limitadas"]')).toHaveCount(0);
 await expect(page.locator('#quick-categories [data-category="Combos"]')).toHaveCount(0);
 await expect(page.locator('#quick-categories [data-category="Ediciones limitadas"]')).toHaveCount(0);
 await expect(page.locator('#arrivals-rail .catalog-card')).toHaveCount(22);
 await expect(page.locator('#promo-combos')).toBeVisible();
 await expect(page.locator('#promo-limited')).toBeVisible();
 await expect(page.locator('#profile-open')).toBeVisible();
 await expect(page.locator('#inquiries-open')).toBeVisible();
 await expect(page.locator('#favorites-open')).toBeVisible();
 await expect(page.locator('#contact-open')).toBeVisible();
 await expect(page.locator('#site-search')).toBeVisible();
 const layout=await page.evaluate(()=>{
   const rect=id=>document.getElementById(id).getBoundingClientRect();
   const brands=[...document.querySelectorAll('#brand-rail .brand-card')].map(x=>x.getBoundingClientRect());
   const cat=[...document.querySelectorAll('#category-grid .category-tile')].map(x=>x.getBoundingClientRect());
   const nav=rect('side-nav'),main=document.querySelector('main').getBoundingClientRect(),hero=rect('inicio');
   return {navX:nav.x,navW:nav.width,mainX:main.x,heroH:hero.height,
     brandRows:new Set(brands.map(x=>Math.round(x.y))).size,
     firstCategoryRow:cat.slice(0,3).map(x=>Math.round(x.y)),
     secondCategoryRow:cat.slice(3).map(x=>Math.round(x.y)),
     order:[...['marcas','categorias','novedades','browse'].map(id=>document.getElementById(id).getBoundingClientRect().top)]};
 });
 expect(layout.navX).toBe(0);
 expect(layout.navW).toBeLessThan(55);
 expect(layout.mainX).toBeGreaterThanOrEqual(42);
 expect(layout.heroH).toBeGreaterThanOrEqual(170);
 expect(layout.brandRows).toBe(1);
 expect(new Set(layout.firstCategoryRow).size).toBe(1);
 expect(new Set(layout.secondCategoryRow).size).toBe(1);
 expect(layout.secondCategoryRow[0]).toBeGreaterThan(layout.firstCategoryRow[0]);
 expect(layout.order[0]).toBeLessThan(layout.order[1]);
 expect(layout.order[1]).toBeLessThan(layout.order[2]);
 expect(layout.order[2]).toBeLessThan(layout.order[3]);
 await page.screenshot({path:'test-results/elegance-mobile-reference.png',fullPage:true});
});
test('all visible mobile nav links respond without fabricated inventory',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 await page.locator('#side-nav [data-nav="Tenis"]').click();
 await expect(page.locator('#browse-title')).toContainText('Tenis');
 await page.locator('#side-nav [data-nav="Bolsas"]').click();
 await expect(page.locator('#browse-title')).toContainText('Bolsas');
 await expect(page.locator('#side-nav [data-nav="Memorias"]')).toHaveCount(0);
 await expect(page.locator('#category-grid [data-category="Memorias"]')).toHaveCount(0);
 await expect(page.locator('#filter-category option[value="Memorias"]')).toHaveCount(0);
 await page.locator('#side-nav [data-nav="Combos"]').click();
 await expect(page.locator('#browse-title')).toContainText('IDEAS PARA COMBOS');
 await expect(page.locator('#product-grid .catalog-card').first()).toBeVisible();
 await page.locator('#side-nav [data-nav="Ediciones limitadas"]').click();
 await expect(page.locator('#browse-title')).toContainText('EDICIONES LIMITADAS');
 await expect(page.locator('#no-results')).toBeVisible();
 await expect(page.locator('#no-results')).toContainText('Todavía no hay ediciones limitadas verificadas');
 await page.locator('#promo-combos').click();
 await expect(page.locator('#browse-title')).toContainText('IDEAS PARA COMBOS');
 await page.locator('#promo-limited').click();
 await expect(page.locator('#browse-title')).toContainText('EDICIONES LIMITADAS');
 await page.locator('#clear-filters').click();
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 await page.locator('#toggle-menu').click();
 await expect(page.locator('#side-nav')).toHaveClass(/collapsed/);
 await page.locator('#toggle-menu').click();
 await expect(page.locator('#side-nav')).not.toHaveClass(/collapsed/);
});
test('mobile categories favorites cart details search brand, account and WhatsApp open real interactions',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 await page.locator('#category-grid [data-category="Tenis"]').click();
 await expect(page.locator('#browse-title')).toContainText('Tenis');
 await page.locator('#brand-rail [data-brand="Otras marcas"]').click();
 await expect(page.locator('#browse-title')).toContainText('Otras marcas');
 await page.locator('#clear-filters').click();
 await page.locator('#product-grid .floating-heart').first().click();
 await page.locator('#product-grid .query-add').first().click();
 await expect(page.locator('#fav-count')).toHaveText('1');
 await expect(page.locator('#inquiry-count')).toHaveText('1');
 await page.locator('#profile-open').click();
 await expect(page.locator('#profile-dialog')).toBeVisible();
 await expect(page.locator('#profile-dialog')).toContainText('se guardan en este navegador');
 await page.locator('#profile-favorites').click();
 await expect(page.locator('#list-dialog')).toBeVisible();
 await page.locator('#close-list').click();
 await page.locator('#inquiries-open').click();
 await expect(page.locator('#list-dialog')).toContainText('E-');
 await page.locator('#close-list').click();
 await page.locator('#contact-open').click();
 await expect(page.locator('#contact-dialog')).toContainText('no está confirmado');
 await page.locator('#close-contact').click();
 await page.locator('#product-grid [data-open]').first().click();
 await expect(page.locator('#item-dialog')).toBeVisible();
 await expect(page.locator('#item-dialog')).not.toContainText('$');
 await page.locator('#close-item').click();
 await page.locator('#site-search').fill('imposible-123x');
 await expect(page.locator('#no-results')).toBeVisible();
});


test('Ver todas expands brands/categories and shows full arrivals catalog; Ver menos reverses',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#brand-rail .brand-card')).toHaveCount(7);
 await page.locator('#all-brands').click();
 // Eleven original brand tiles must remain, plus any genuinely discovered brands.
 await expect.poll(async()=>page.locator('#brand-rail .brand-card').count())
  .toBeGreaterThanOrEqual(11);
 await expect(page.locator('#all-brands')).toContainText('Ver menos');
 await page.locator('#all-brands').click();
 await expect(page.locator('#brand-rail .brand-card')).toHaveCount(7);
 await expect(page.locator('#category-grid .category-tile')).toHaveCount(6);
 await page.locator('#all-categories').click();
 const count=await page.locator('#category-grid .category-tile').count();
 expect(count).toBeGreaterThan(6);
 await expect(page.locator('#all-categories')).toContainText('Ver menos');
 await page.locator('#all-categories').click();
 await expect(page.locator('#category-grid .category-tile')).toHaveCount(6);
 await page.locator('#side-nav [data-nav="Tenis"]').click();
 await expect(page.locator('#browse-title')).toContainText('Tenis');
 await page.locator('#all-arrivals').click();
 await expect(page.locator('#browse-title')).toContainText('EXPLORAR CATÁLOGO');
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
});
