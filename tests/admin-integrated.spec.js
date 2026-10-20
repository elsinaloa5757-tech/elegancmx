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
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
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
 await expect(page.locator('#admin-count-files')).toContainText('3,929');
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
 await expect(page.locator('#admin-message')).toContainText('IMAGEKIT_PRIVATE_KEY');
 await expect(page.locator('#admin-upload')).toBeDisabled();
});
