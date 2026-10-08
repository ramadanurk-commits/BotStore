import {db} from './db';
type User={id:string;email:string;admin:boolean}|null;
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tiers=['install','support','custom','hosting'];
const sectors=['sto','salon','shop','studio','other'];
const statuses=['new','contacted','quoted','in_progress','done','declined'];
function string(value:unknown,max:number){return typeof value==='string'&&value.length<=max?value.trim():null}
async function payload(req:Request){if(Number(req.headers.get('content-length')||0)>12000)return null;const raw=await req.text();if(raw.length>12000)return null;try{const b=JSON.parse(raw);return b&&typeof b==='object'&&!Array.isArray(b)?b:null}catch{return null}}
async function digest(text:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),x=>x.toString(16).padStart(2,'0')).join('')}
async function limited(req:Request,scope:string,subject:string,limit:number){
 const hour=Math.floor(Date.now()/3600000);await db().prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('rate_salt',?)").bind(crypto.randomUUID()).run();
 const salt=await db().prepare("SELECT value FROM settings WHERE key='rate_salt'").first<{value:string}>();
 const keys=[await digest(salt!.value+scope+hour+subject)];const ip=req.headers.get('CF-Connecting-IP');if(ip)keys.push(await digest(salt!.value+scope+hour+ip));
 for(const key of keys){const row=await db().prepare('INSERT INTO request_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(key,(hour+2)*3600000,limit).first();if(!row)return true;}return false;
}
export async function salesRoute(req:Request,path:string[],u:User):Promise<Response|null>{
 const area=path[0];if(!['service-requests','catalog-events','analytics'].includes(area))return null;
 const writing=req.method==='POST';if(!['GET','POST'].includes(req.method))return reply({error:'notFound'},404);
 if(writing&&req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'forbidden'},403);
 if(area==='service-requests'){
  if(writing&&!path[1]){
   const b=await payload(req);if(!b)return reply({error:'invalid'},400);
   const name=string(b.name,100),contact=string(b.contact,200),message=string(b.message,3000),productId=b.productId?string(b.productId,100):null;
   const phone=contact?.replace(/[\s()+-]/g,'');
   if(!uuid.test(b.id||'')||!name||name.length<2||!contact||(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)&&!/^\d{10,15}$/.test(phone||''))||!message||message.length<10||!tiers.includes(b.tier)||!sectors.includes(b.sector)||!['kk','ru','en'].includes(b.language)||b.consent!==true||b.website)return reply({error:'invalid'},400);
   if(productId&&!await db().prepare("SELECT id FROM products WHERE id=? AND status='published'").bind(productId).first())return reply({error:'notFound'},404);
   if(await limited(req,'request',contact.toLowerCase(),5))return reply({error:'rateLimit'},429);
   const now=Date.now();await db().prepare('INSERT OR IGNORE INTO service_requests (id,user_id,product_id,tier,sector,language,name,contact,message,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(b.id,u?.id||null,productId,b.tier,b.sector,b.language,name,contact,message,'new',now,now).run();
   return reply({ok:true,id:b.id});
  }
  if(!u)return reply({error:'signin'},401);
  if(req.method==='GET'&&!path[1]){
   const s=new URL(req.url).searchParams.get('status');if(s&&!statuses.includes(s))return reply({error:'invalid'},400);
   const q=u.admin?(s?'SELECT * FROM service_requests WHERE status=? ORDER BY created_at DESC LIMIT 200':'SELECT * FROM service_requests ORDER BY created_at DESC LIMIT 200'):'SELECT id,product_id,tier,sector,status,quote,deadline,created_at FROM service_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 200';
   const p=db().prepare(q);const rows=await (u.admin?(s?p.bind(s):p):p.bind(u.id)).all();return reply({requests:rows.results});
  }
  if(writing&&path[1]){
   if(!u.admin)return reply({error:'forbidden'},403);const b=await payload(req);if(!b)return reply({error:'invalid'},400);
   const note=string(b.note,3000),deadline=string(b.deadline,100),quote=b.quote===null?null:b.quote;
   if(!statuses.includes(b.status)||note===null||deadline===null||!Number.isInteger(b.updated_at)||(quote!==null&&(!Number.isInteger(quote)||quote<0||quote>10000000)))return reply({error:'invalid'},400);
   const now=Math.max(Date.now(),b.updated_at+1);const results=await db().batch([
    db().prepare('UPDATE service_requests SET status=?,quote=?,deadline=?,note=?,updated_at=? WHERE id=? AND updated_at=?').bind(b.status,quote,deadline,note,now,path[1],b.updated_at),
    db().prepare("INSERT INTO audit (id,actor,action,target,created_at) SELECT ?,?,'service:update',?,? WHERE changes()>0").bind(crypto.randomUUID(),u.email,path[1],now)
   ]);if(!results[0].meta.changes)return reply({error:'conflict'},409);return reply({ok:true});
  }
 }
 if(area==='catalog-events'&&writing&&!path[1]){
  const b=await payload(req);if(!b||!['view','checkout'].includes(b.kind)||!uuid.test(b.session||'')||b.consent!==true||!string(b.productId,100))return reply({error:'invalid'},400);
  if(!await db().prepare("SELECT id FROM products WHERE id=? AND status='published'").bind(b.productId).first())return reply({error:'notFound'},404);
  if(await limited(req,'events',b.session,120))return reply({error:'rateLimit'},429);
  const now=Date.now(),day=new Date(now+5*3600000).toISOString().slice(0,10);
  await db().prepare('INSERT OR IGNORE INTO catalog_events (id,product_id,kind,session,day,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),b.productId,b.kind,b.session,day,now).run();return reply({ok:true});
 }
 if(area==='analytics'&&req.method==='GET'){
  if(!u)return reply({error:'signin'},401);if(!u.admin)return reply({error:'forbidden'},403);
  const since=Date.now()-30*86400000;
  const [events,orders,requests,products]=await Promise.all([
   db().prepare('SELECT product_id,kind,COUNT(*) AS count FROM catalog_events WHERE created_at>=? GROUP BY product_id,kind').bind(since).all<any>(),
   db().prepare("SELECT product_id,COUNT(*) AS orders,SUM(CASE WHEN status='paid' AND price>0 THEN 1 ELSE 0 END) AS paid,SUM(CASE WHEN status='paid' AND price=0 THEN 1 ELSE 0 END) AS free,COALESCE(SUM(CASE WHEN status='paid' THEN price ELSE 0 END),0) AS revenue FROM orders WHERE created_at>=? GROUP BY product_id").bind(since).all<any>(),
   db().prepare('SELECT status,COUNT(*) AS count FROM service_requests WHERE created_at>=? GROUP BY status').bind(since).all(),
   db().prepare('SELECT id,content FROM products ORDER BY created_at').all<any>()
  ]);
  const rows=products.results.map(p=>{const o=orders.results.find(x=>x.product_id===p.id);return {id:p.id,content:JSON.parse(p.content),views:events.results.find(e=>e.product_id===p.id&&e.kind==='view')?.count||0,checkouts:events.results.find(e=>e.product_id===p.id&&e.kind==='checkout')?.count||0,orders:o?.orders||0,paid:o?.paid||0,free:o?.free||0,revenue:o?.revenue||0}});
  await db().batch([db().prepare('DELETE FROM catalog_events WHERE created_at<?').bind(Date.now()-90*86400000),db().prepare('DELETE FROM request_limits WHERE expires_at<?').bind(Date.now())]);
  return reply({since,rows,requests:requests.results});
 }
 return reply({error:'notFound'},404);
}
