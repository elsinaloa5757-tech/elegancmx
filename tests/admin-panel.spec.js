const {test,expect}=require('@playwright/test');
const HOST='https://czekazhacqaamwecjthp.supabase.co';
const U='00000000-0000-4000-8000-000000000001';
function mockApi(page,{configured=true}={}){
 const posted=[],imagekit=[];
 page.route(HOST+'/**',async route=>{
  const req=route.request(),url=new URL(req.url()),post=req.postDataJSON?.();
  if(url.pathname.endsWith('/auth/v1/token')){
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
    body:JSON.stringify({access_token:'mock-access',refresh_token:'mock-refresh',expires_at:Math.round(Date.now()/1000)+3600,user:{id:U,email:'owner@elegance.test'}})});
  }
  if(url.pathname.endsWith('/auth/v1/user'))return route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({id:U,email:'owner@elegance.test'})});
  if(url.pathname.endsWith('/functions/v1/elegance-admin-upload')){
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
    body:JSON.stringify(post.action==='status'?{authorized:true,imagekitConfigured:configured,maxBatch:250}:
     {publicKey:'public_test',tokens:Array.from({length:post.count},(_,i)=>({token:'t'+i,signature:'test',expire:Math.floor(Date.now()/1000)+900})),
      folder:'/elegance/products',uploadUrl:'https://upload.imagekit.io/api/v1/files/upload'})});
  }
  if(url.pathname.endsWith('/rest/v1/elegance_uploaded_media')){
   if(req.method()==='POST'){posted.push(post);return route.fulfill({status:201,contentType:'application/json',body:'{}'})}
   if(req.method()==='PATCH'){posted.push(post);return route.fulfill({status:204,body:''})}
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'[]'});
  }
  return route.fulfill({status:404,body:'{}'});
 });
 let n=0;
 page.route('https://upload.imagekit.io/**',async route=>{
  const body=route.request().postDataBuffer();
  imagekit.push(body);
  n++;
  return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
   body:JSON.stringify({fileId:'mock'+n,url:'https://ik.imagekit.io/elegancemx/elegance/products/test'+n+'.webp'})});
 });
 return {posted,imagekit};
}
test('administrator button opens only a password login, never an open public uploader',async({page})=>{
 await page.goto('/');
 await page.locator('#admin-open').click();
 await expect(page.locator('#elegance-admin-modal')).toBeVisible();
 await expect(page.locator('#admin-signin')).toBeVisible();
 await expect(page.locator('#admin-private')).toBeHidden();
 await expect(page.locator('#admin-password')).toHaveAttribute('type','password');
 await page.locator('#admin-close').click();
 await expect(page.locator('#elegance-admin-modal')).toBeHidden();
 await expect(page.locator('footer a[href="./studio.html"]')).toHaveCount(0);
});
test('signed admin can select and upload compressed photos to ImageKit in one box',async({page})=>{
 const mocked=mockApi(page);
 await page.goto('/');
 await page.locator('#admin-open').click();
 await page.locator('#admin-email').fill('owner@elegance.test');
 await page.locator('#admin-password').fill('my-secret-is-never-stored');
 await page.locator('#admin-signin button[type=submit]').click();
 await expect(page.locator('#admin-private')).toBeVisible();
 await expect(page.locator('#admin-dropzone')).toBeVisible();
 const tiny=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=40;canvas.height=40;const ctx=canvas.getContext('2d');ctx.fillStyle='#2563eb';ctx.fillRect(0,0,40,40);return canvas.toDataURL('image/png').split(',')[1]});
 await page.locator('#admin-file-input').setInputFiles([
 {name:'photo-1.png',mimeType:'image/png',buffer:Buffer.from(tiny,'base64')},
 {name:'photo-2.png',mimeType:'image/png',buffer:Buffer.from(tiny,'base64')}
 ]);
 await expect(page.locator('#admin-selected')).toContainText('2 archivos');
 await page.locator('#admin-start-upload').click();
 await expect(page.locator('#admin-status')).toContainText('2 archivos subidos', {timeout:12000});
 expect(mocked.imagekit).toHaveLength(2);
 expect(mocked.posted).toHaveLength(2);
 expect(mocked.posted.every(row=>row.visible===false&&row.reviewed===false)).toBe(true);
 expect(mocked.posted.every(row=>row.file_url.includes('imagekit.io/elegancemx/'))).toBe(true);
});
test('maximum 250 per batch enforced and ImageKit unavailable shows truthful disabled state',async({page})=>{
 mockApi(page,{configured:false});
 await page.goto('/');
 await page.locator('#admin-open').click();
 await page.locator('#admin-email').fill('owner@elegance.test');
 await page.locator('#admin-password').fill('password');
 await page.locator('#admin-signin button[type=submit]').click();
 await expect(page.locator('#admin-status')).toContainText('Falta configurar');
 await expect(page.locator('#admin-start-upload')).toBeDisabled();
 const mock=Array.from({length:251},(_,i)=>({name:'ref-'+i+'.jpg',mimeType:'image/jpeg',buffer:Buffer.from([255,216,255,217])}));
 await page.locator('#admin-file-input').setInputFiles(mock);
 await expect(page.locator('#admin-status')).toContainText('Máximo 250');
 await expect(page.locator('#admin-start-upload')).toBeDisabled();
});
