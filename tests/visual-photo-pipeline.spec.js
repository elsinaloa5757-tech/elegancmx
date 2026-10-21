const {test,expect}=require('@playwright/test');

test('newly uploaded visible media enters the storefront before scheduled CLIP export',async({page})=>{
 const media=(await(await page.request.get('/data/imagekit-media.json')).json()).find(x=>x.mime.startsWith('image/'));
 const fileId='elegance-test-new-upload-2026';
 await page.route('**/functions/v1/elegance-admin',r=>r.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify({
     ok:true,hiddenIds:[],media:[{
       imagekit_file_id:fileId,url:media.url,mime:'image/webp',
       title:null,category:null,brand:null,group_id:null,
       created_at:'2099-01-01T00:00:00Z'
     }]
   })
 }));
 await page.goto('/');
 await expect(page.locator('#browse-count')).toContainText('3,912');
 const card=page.locator('#arrivals-rail [data-open="'+fileId+'"]').first();
 await expect(card).toBeVisible();
 await card.click();
 await expect(page.locator('#item-detail')).toContainText('Por clasificar');
 await expect(page.locator('#item-detail')).not.toContainText('$');
});

test('only owner-confirmed group_id merges two photos into one catalog gallery',async({page})=>{
 const a='6acadfcbead997d09af5a0db',b='6acfd156ead997d09a86ef7c';
 const rows=(await(await page.request.get('/data/imagekit-media.json')).json());
 const first=rows.find(x=>x.fileId===a),second=rows.find(x=>x.fileId===b);
 expect(first&&second).toBeTruthy();
 await page.route('**/functions/v1/elegance-admin',r=>r.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify({
     ok:true,hiddenIds:[],media:[
       {imagekit_file_id:a,url:first.url,mime:first.mime,group_id:null,created_at:first.createdAt},
       {imagekit_file_id:b,url:second.url,mime:second.mime,group_id:a,created_at:second.createdAt}
     ]
   })
 }));
 await page.goto('/');
 await page.locator('#site-search').fill(a);
 const representative=page.locator('#product-grid [data-open="'+a+'"]').first();
 await expect(representative).toBeVisible();
 await representative.click();
 await expect(page.locator('#item-detail [data-gallery="'+b+'"]')).toBeVisible();
 await expect(page.locator('#item-detail')).not.toContainText('$');
});

test('similarity proposals do not auto merge or invent an approved product',async({page})=>{
 const a='6acadfcbead997d09af5a0db',b='6acfd156ead997d09a86ef7c';
 await page.route('**/data/visual-relations.json',r=>r.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify({
      version:1,verified:false,pairs:[{a,b,category:'Tenis',distance:0}]
   })
 }));
 await page.route('**/functions/v1/elegance-admin',r=>r.fulfill({
   status:200,contentType:'application/json',
   body:JSON.stringify({ok:true,hiddenIds:[],media:[]})
 }));
 await page.goto('/');
 await page.locator('#site-search').fill(a);
 await page.locator('#product-grid [data-open="'+a+'"]').first().click();
 await expect(page.locator('#item-detail')).toContainText('Fotografías visualmente parecidas (sin agrupar ni confirmar)');
 await expect(page.locator('#item-detail [data-similar="'+b+'"]')).toBeVisible();
});
