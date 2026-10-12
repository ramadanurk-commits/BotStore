import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const require=createRequire(import.meta.url);
const {build}=createRequire(require.resolve('vite'))('esbuild');
const {Miniflare}=createRequire(require.resolve('wrangler'))('miniflare');
const directory=await mkdtemp(path.join(tmpdir(),'botstore-backend-'));
await mkdir('.sites-runtime',{recursive:true});
await build({stdin:{contents:"import {handle} from './lib/api'; export default {fetch:handle}",resolveDir:process.cwd(),sourcefile:'persistence-entry.ts'},bundle:true,format:'esm',platform:'browser',target:'es2022',external:['cloudflare:workers','node:crypto'],outfile:'.sites-runtime/persistence-test.js'});
const options={modules:true,scriptPath:'.sites-runtime/persistence-test.js',compatibilityDate:'2026-05-01',compatibilityFlags:['nodejs_compat'],bindings:{ADMIN_EMAIL:'owner@example.test'},d1Databases:['DB'],d1Persist:path.join(directory,'d1'),r2Buckets:['BUCKET']};
let worker=null,checks=0;
function check(value,message){assert.ok(value,message);checks++;}
async function call(endpoint,{admin=false,body,origin='http://backend.test'}={}){
 const headers={};
 if(admin){headers['oai-authenticated-user-id']='persistence-owner';headers['oai-authenticated-user-email']='owner@example.test';}
 if(body!==undefined){headers.origin=origin;headers['content-type']='application/json';}
 const response=await worker.dispatchFetch('http://backend.test/api/'+endpoint,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});
 return {status:response.status,headers:response.headers,data:await response.json()};
}
try{
 worker=new Miniflare(options);
 const database=await worker.getD1Database('DB');
 for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){
  for(const statement of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await database.prepare(statement).run();
 }
 const health=await call('health');
 check(health.status===200&&health.data.status==='ok'&&health.data.database==='connected','anonymous health probes a real database');
 check(health.headers.get('cache-control')==='no-store','health is not cached');
 check(Number.isFinite(Date.parse(health.data.serverTime)),'health returns server time');
 check(Object.keys(health.data).sort().join(',')==='database,serverTime,status','health does not expose users, secrets or database rows');
 check((await call('health',{body:{}})).status===405,'health rejects writes');
 check((await call('health/extra')).status===404,'health path is exact');
 const payload={id:randomUUID(),tier:'install',sector:'salon',language:'kk',name:'[TEST] Backend persistence',contact:'persistence@example.test',message:'This isolated request verifies durable storage after a Worker restart.',consent:true,website:''};
 const saved=await call('service-requests',{body:payload});
 check(saved.status===200&&saved.data.id===payload.id,'public form saves a request');
 check((await call('service-requests')).status===401,'public visitors cannot read customer requests');
 let rows=(await call('service-requests',{admin:true})).data.requests;
 check(rows.length===1&&rows[0].contact===payload.contact,'authorized administrator reads the saved request');
 await worker.dispose();worker=null;
 worker=new Miniflare(options);
 check((await call('health')).data.database==='connected','database remains connected after restart');
 rows=(await call('service-requests',{admin:true})).data.requests;
 check(rows.length===1&&rows[0].id===payload.id&&rows[0].message===payload.message,'request survives a full Worker restart');
 check((await call('service-requests',{body:payload})).status===200,'retry after restart succeeds');
 check((await call('service-requests',{admin:true})).data.requests.length===1,'retry after restart does not duplicate data');
 check((await call('service-requests',{body:{...payload,id:randomUUID()},origin:'https://other.example.test'})).status===403,'cross-origin form submission is rejected');
 await worker.dispose();worker=null;
 worker=new Miniflare({...options,d1Databases:[]});
 check((await call('health')).status===503,'missing database returns unavailable instead of a false healthy response');
 console.log(`Backend persistence: ${checks} checks passed. Request survived a Worker restart in an isolated database.`);
}finally{
 if(worker)await worker.dispose();
 await rm(directory,{recursive:true,force:true});
}
