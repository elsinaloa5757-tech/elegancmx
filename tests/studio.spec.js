const {test,expect}=require('@playwright/test');
test('Old Studio URL redirects to a single in-store Administrador',async({page})=>{
 await page.goto('/studio.html');
 await expect(page.locator('#admin-dialog')).toBeVisible();
 await expect(page.locator('#admin-login-form')).toBeVisible();
 await expect(page.locator('#admin-workspace')).toBeHidden();
 await expect(page.locator('#admin-nav-open')).toBeVisible();
 await expect(page).toHaveTitle(/Elegance MX/);
 const url=new URL(page.url());
 expect(url.pathname).toBe('/');
});
test('Published owner curation hides grouped photos and changes product title/category',async({page})=>{
 await page.goto('/');
 const data=await page.evaluate(async()=> (await(await fetch('data/imagekit-media.json')).json())
   .filter(x=>x.mime.startsWith('image/')).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,3));
 const [a,b,c]=data;
 await page.route('**/data/catalog-curation.json',route=>route.fulfill({status:200,contentType:'application/json',
  body:JSON.stringify({version:1,entries:{
    [a.fileId]:{name:'Tenis aprobados por Administrador',category:'Tenis',reviewed:true,groupId:a.fileId},
    [b.fileId]:{name:'Vista secundaria',groupId:a.fileId},
    [c.fileId]:{hidden:true}
  }})
 }));
 await page.reload();
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 await expect(page.locator('#product-grid .card-title').first()).toContainText('Tenis aprobados por Administrador');
 await page.locator('#product-grid [data-open]').first().click();
 await expect(page.locator('#item-dialog')).toBeVisible();
 await expect(page.locator('#item-detail .detail-gallery button')).toHaveCount(2);
 await expect(page.locator('#item-dialog')).not.toContainText('$');
});
