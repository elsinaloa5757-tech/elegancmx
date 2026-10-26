const {test}=require('@playwright/test');
const {execFileSync}=require('node:child_process');
test('research only: inspect public CC0 leopard GLB; no production changes',()=>{const s=execFileSync('node',['scripts/audit-cc0-leopard.mjs'],{encoding:'utf8',timeout:40000});console.log(s);});
