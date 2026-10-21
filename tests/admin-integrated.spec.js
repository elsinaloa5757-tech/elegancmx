const {test,expect}=require('@playwright/test');
const ADMIN_API='https://czekazhacqaamwecjthp.supabase.co/functions/v1/elegance-admin';
const AUTH='https://czekazhacqaamwecjthp.supabase.co/auth/v1/token?grant_type=password';

test('Administrador lives inside Elegance MX and hides all editing tools from visitors',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 await expect(page.locator('#admin-nav-open')).toBeVisible();
 await page.locator('#admin-nav-open').click();
 await expect(page.locator('#admin-dialog')).toBeVisible();
 await expect(page.locator('#admin-login-form')).toBeVisible();
 await expect(page.locator('#admin-workspace')).toBeHidden();
 await expect(page.locator('#admin-files')).toHaveAttribute('multiple','');
 await expect(page.locator('#admin-dialog')).toContainText('250');
 await page.locator('#admin-close').click();
 await expect(page.locator('#admin-dialog')).not.toBeVisible();
 await expect(page.locator('#admin-header-open')).toBeVisible();
 await page.locator('#admin-header-open').click();
 await expect(page.locator('#admin-dialog')).toBeVisible();
 await page.locator('#admin-close').click();
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
});
test('Direct admin URL automatically opens protected login without exposing management',async({page})=>{
 await page.goto('/?administrador=1');
 await expect(page.locator('#admin-dialog')).toBeVisible();
 await expect(page.locator('#admin-login-form')).toBeVisible();
 await expect(page.locator('#admin-workspace')).toBeHidden();
});
test('Account with password but without Elegance allowlist cannot upload',async({page})=>{
 await page.route(AUTH,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'test-only-access',refresh_token:'test-only-refresh'})}));
 await page.route(ADMIN_API,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,allowed:false,email:'visitor@example.com',imagekitReady:true})}));
 await page.goto('/');await page.locator('#admin-nav-open').click();
 await page.locator('#admin-email').fill('visitor@example.com');
 await page.locator('#admin-password').fill('an-example-password');
 await page.locator('#admin-signin').click();
 await expect(page.locator('#admin-message')).toContainText('sin permiso administrativo');
 await expect(page.locator('#admin-workspace')).toBeHidden();
});
test('Guarded administrator accepts one batch up to 250 files and refuses 251st',async({page})=>{
 await page.route(AUTH,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'mock-user',refresh_token:'mock-refresh'})}));
 await page.route(ADMIN_API,async route=>{
  const {action}=route.request().postDataJSON();
  const body=action==='status'?{ok:true,allowed:true,email:'admin@example.com',imagekitReady:true}:
   action==='list'?{ok:true,items:[]}:{ok:false,error:'No está autorizado'};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto('/');
 await page.locator('#admin-nav-open').click();
 await page.locator('#admin-email').fill('admin@example.com');
 await page.locator('#admin-password').fill('example-password');
 await page.locator('#admin-signin').click();
 await expect(page.locator('#admin-workspace')).toBeVisible();
 const mediaCount=await page.evaluate(async()=> (await(await fetch('data/imagekit-media.json')).json()).length);
 await expect(page.locator('#admin-count-files')).toContainText(mediaCount.toLocaleString('en-US'));
 const files=Array.from({length:250},(_,i)=>({name:'elegance-'+i+'.jpg',mimeType:'image/jpeg',buffer:Buffer.from([255,216,255,217])}));
 await page.locator('#admin-files').setInputFiles(files);
 await expect(page.locator('#admin-count-batch')).toHaveText('250/250');
 await expect(page.locator('#admin-upload')).toBeEnabled();
 await page.locator('#admin-files').setInputFiles({name:'archivo-251.jpg',mimeType:'image/jpeg',buffer:Buffer.from([255,216,255,217])});
 await expect(page.locator('#admin-count-batch')).toHaveText('250/250');
 await expect(page.locator('#admin-message')).toContainText('Máximo 250');
 await page.locator('#admin-clear-files').click();
 await expect(page.locator('#admin-count-batch')).toHaveText('0/250');
});
test('ImageKit keys not configured: administrator can inspect catalog but cannot start upload',async({page})=>{
 await page.route(AUTH,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'mock-user',refresh_token:'mock-refresh'})}));
 await page.route(ADMIN_API,async route=>{
  const {action}=route.request().postDataJSON();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(action==='status'?
   {ok:true,allowed:true,email:'admin@example.com',imagekitReady:false}:{ok:true,items:[]})});
 });
 await page.goto('/');
 await page.locator('#admin-nav-open').click();
 await page.locator('#admin-email').fill('admin@example.com');
 await page.locator('#admin-password').fill('example-password');
 await page.locator('#admin-signin').click();
 await expect(page.locator('#admin-workspace')).toBeVisible();
 await expect(page.locator('#admin-message')).toContainText('conexión protegida a ImageKit');
 await expect(page.locator('#admin-upload')).toBeDisabled();
});


test('New authorized batch uploads an optimized image via ImageKit and preserves the final progress report',async({page})=>{
 let registered=null,remoteCalls=0;
 await page.route(AUTH,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'mock-admin',refresh_token:'mock-refresh'})}));
 await page.route(ADMIN_API,async route=>{
  const {action}=route.request().postDataJSON();
  let data={ok:true};
  if(action==='status')data={ok:true,allowed:true,email:'admin@example.com',imagekitReady:true};
  else if(action==='list')data={ok:true,items:registered?[registered]:[]};
  else if(action==='check')data={ok:true,duplicate:false};
  else if(action==='upload-auth')data={ok:true,publicKey:'public_test',token:'one-test',signature:'123abc',expire:9999999999,folder:'/elegance/products'};
  else if(action==='register'){
   registered={id:'11111111-1111-4111-8111-111111111111',imagekit_file_id:'fake-test-file-123',
     filename:'image.png',url:'https://ik.imagekit.io/elegancemx/elegance/products/upload-test.webp',
     mime:'image/webp',bytes:300,title:null,description:null,brand:null,category:null,price:null,
     stock:null,visible:true,created_at:'2026-10-20T23:00:00Z',ai_status:'pending'};
   data={ok:true,item:registered};
  }else data={ok:false,error:'Unexpected action'};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.route('https://upload.imagekit.io/api/v1/files/upload',async route=>{
  remoteCalls++;
  await route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({fileId:'fake-test-file-123',url:'https://ik.imagekit.io/elegancemx/elegance/products/upload-test.webp'})});
 });
 await page.goto('/');
 await page.locator('#admin-nav-open').click();
 await page.locator('#admin-email').fill('admin@example.com');
 await page.locator('#admin-password').fill('example-password');
 await page.locator('#admin-signin').click();
 await expect(page.locator('#admin-workspace')).toBeVisible();
 const valid=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGPUbFrNwMDAxMDAwMDAAAAPsAFao+lT1gAAAABJRU5ErkJggg==','base64');
 await page.locator('#admin-files').setInputFiles({name:'image.png',mimeType:'image/png',buffer:valid});
 await page.locator('#admin-upload').click();
 await expect(page.locator('#admin-message')).toContainText('1 subidos',{timeout:20000});
 await expect(page.locator('#admin-count-batch')).toHaveText('0/250');
 await expect(page.locator('#admin-count-uploaded')).toHaveText('1');
 expect(remoteCalls).toBe(1);
 expect(registered).not.toBeNull();
});
test('Fresh Supabase media appears without GitHub redeployment; owner categories override AI drafts',async({page})=>{
 await page.route('**/rest/v1/elegance_admin_media?**',route=>route.fulfill({status:200,contentType:'application/json',
  body:JSON.stringify([{
   imagekit_file_id:'latest-imk-product-abc',url:'https://ik.imagekit.io/elegancemx/elegance/products/just-uploaded.webp',
   filename:'just-uploaded.webp',mime:'image/webp',title:'Tenis de prueba recién cargados',description:null,
   brand:'Nike',category:'Tenis',price:null,stock:null,visible:true,ai_status:'reviewed',
   created_at:'2030-10-20T23:59:59Z'
  }])}));
 await page.route('**/functions/v1/elegance-admin',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,hiddenIds:[]})}));
 await page.goto('/');
 await expect(page.locator('#product-grid .catalog-card').first()).toContainText('Tenis de prueba recién cargados');
 await expect(page.locator('#product-grid .micro-category').first()).toContainText('Tenis');
 await page.locator('#category-grid [data-category="Tenis"]').click();
 await expect(page.locator('#browse-title')).toContainText('Tenis');
 await expect(page.locator('#product-grid .catalog-card').first()).toContainText('Tenis de prueba recién cargados');
});
