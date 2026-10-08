import{createRequire}from'node:module';import{readFile,readdir}from'node:fs/promises';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const req=createRequire(import.meta.url);const{Miniflare}=createRequire(req.resolve('wrangler'))('miniflare');
const secret='ISOLATED_TEST_SECRET';const mf=new Miniflare({modules:true,scriptPath:'.sites-runtime/api-test.js',compatibilityDate:'2026-05-01',compatibilityFlags:['nodejs_compat'],bindings:{ADMIN_EMAIL:'owner@example.test',FREEDOMPAY_MERCHANT_ID:'123',FREEDOMPAY_SECRET:secret,PAYMENT_MODE:'live',SITE_ORIGIN:'https://example.test'},d1Databases:['DB'],r2Buckets:['BUCKET']});let count=0;
try{const db=await mf.getD1Database('DB');for(const file of(await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const sql of(await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(sql).run();
await db.prepare("INSERT INTO orders(id,user_id,product_id,seller_id,price,content,file_key,filename,status,reference,created_at,updated_at,fee) VALUES('test-order','buyer','test-product','seller',10000,'{}','none','none','pending','',0,0,1500)").run();await db.prepare("INSERT INTO payments(order_id,payment_id,status,created_at) VALUES('test-order','12345','pending',0)").run();
const fields={pg_order_id:'test-order',pg_payment_id:'12345',pg_amount:'10000.00',pg_currency:'KZT',pg_testing_mode:'0',pg_result:'1',pg_salt:'test-salt'};
const sign=f=>createHash('md5').update(['result',...Object.keys(f).filter(k=>k!=='pg_sig').sort().map(k=>f[k]),secret].join(';')).digest('hex');
const call=async(f,bad=false)=>{const r=await mf.dispatchFetch('https://example.test/api/payment/result',{method:'POST',body:new URLSearchParams({...f,pg_sig:bad?'0'.repeat(32):sign(f)})});return{status:r.status,text:await r.text()}};
const check=(v,m)=>{assert.ok(v,m);count++};
check((await call(fields,true)).status===403,'forged signature blocked');
for(const edit of[{pg_amount:'1'},{pg_currency:'USD'},{pg_payment_id:'999'},{pg_testing_mode:'1'},{pg_merchant_id:'999'}])check((await call({...fields,...edit})).text.includes('<pg_status>error</pg_status>'),'mismatched callback blocked');
check((await db.prepare("SELECT status FROM orders WHERE id='test-order'").first()).status==='pending','invalid callbacks do not fulfill');
check((await call(fields)).text.includes('<pg_status>ok</pg_status>'),'valid callback accepted');check((await db.prepare("SELECT status FROM orders WHERE id='test-order'").first()).status==='paid','valid callback fulfills');
check((await call(fields)).text.includes('<pg_status>ok</pg_status>'),'callback replay idempotent');check((await db.prepare('SELECT COUNT(*) AS n FROM orders').first()).n===1,'replay creates no duplicate order');
console.log('PASS: '+count+' signed payment callback checks; no external gateway calls');
}finally{await mf.dispose()}
