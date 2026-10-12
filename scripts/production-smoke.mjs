import assert from 'node:assert/strict';

const argument=process.argv[2]||'https://botstore-kz-market.ra1k0n.chatgpt.site';
const base=new URL(argument);
if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw new Error('Use the HTTPS origin of your deployed BotStore project.');
const origin=base.origin;
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
async function get(endpoint){
 const response=await fetch(origin+'/api/'+endpoint,{redirect:'error',signal:AbortSignal.timeout(20000)});
 const type=response.headers.get('content-type')||'';
 check(type.includes('application/json'),`${endpoint} responds with JSON, not a login page`);
 return {response,data:await response.json()};
}
const health=await get('health');
check(health.response.status===200&&health.data.status==='ok'&&health.data.database==='connected','live server can query its database');
check(health.response.headers.get('cache-control')==='no-store','server health is current');
const catalog=await get('bootstrap');
check(catalog.response.status===200&&Array.isArray(catalog.data.products)&&catalog.data.products.length>0,'public catalog comes from the live API');
const privateList=await get('service-requests');
check(privateList.response.status===401,'anonymous clients cannot read customer requests');
const invalid=await fetch(origin+'/api/service-requests',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify({}),redirect:'error',signal:AbortSignal.timeout(20000)});
check(invalid.status===400,'invalid public form data is rejected without creating a request');
console.log(`Live backend: ${checks} checks passed at ${origin}. No valid form submissions, payments or customer data were created.`);
