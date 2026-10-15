import {randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {db,adminEmail} from './db';

export type Identity={id:string;email:string;name:string;admin:boolean;provider:'chatgpt'|'email'};
type Account={user_id:string;email:string;name:string;salt:string;password_hash:string;recovery_hash:string;version:number;admin_access:number};
const COOKIE='__Host-botstore-session';
const AGE=7*24*60*60;
const encoder=new TextEncoder();
const response=(data:unknown,status=200,cookie?:string)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(cookie?{'Set-Cookie':cookie}:{})}});
const cookie=(value:string,age=AGE)=>`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const token=()=>randomBytes(32).toString('hex');
async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),n=>n.toString(16).padStart(2,'0')).join('');}
async function passwordHash(password:string,salt:string):Promise<Uint8Array>{return new Promise((resolve,reject)=>scrypt(password,salt,32,{N:32768,r:8,p:3,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));}
const hex=(value:Uint8Array)=>Array.from(value,n=>n.toString(16).padStart(2,'0')).join('');
function sameHash(value:Uint8Array,stored:string){if(!/^[0-9a-f]{64}$/.test(stored))return false;const bytes=Uint8Array.from(stored.match(/../g)!,part=>parseInt(part,16));return timingSafeEqual(value,bytes);}
function sessionToken(req:Request){const parts=(req.headers.get('cookie')||'').split(';').map(part=>part.trim()).filter(part=>part.startsWith(COOKIE+'='));if(parts.length!==1)return null;const value=parts[0].slice(COOKIE.length+1);return /^[0-9a-f]{64}$/.test(value)?value:null;}
function email(value:unknown){if(typeof value!=='string')return null;const result=value.trim().toLowerCase();return result.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)?result:null;}
function validPassword(value:unknown):value is string{return typeof value==='string'&&value.length>=15&&value.length<=128&&/\S/.test(value);}
async function readBody(req:Request){
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')||Number(req.headers.get('content-length')||0)>8192)return null;
 const reader=req.body?.getReader();if(!reader)return null;const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return null;}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{const data=JSON.parse(new TextDecoder().decode(bytes));return data&&typeof data==='object'&&!Array.isArray(data)?data:null;}catch{return null;}
}
export function platformIdentity(req:Request):Identity|null{
 const id=req.headers.get('oai-authenticated-user-id'),address=req.headers.get('oai-authenticated-user-email');if(!id||!address)return null;
 let name=address;try{if(req.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8')name=decodeURIComponent(req.headers.get('oai-authenticated-user-full-name')||address);}catch{}
 return {id,email:address,name,admin:!!adminEmail()&&address.toLowerCase()===adminEmail(),provider:'chatgpt'};
}
export async function resolveIdentity(req:Request):Promise<Identity|null>{
 const platform=platformIdentity(req);if(platform)return platform;
 const raw=sessionToken(req);if(!raw)return null;
 const row=await db().prepare('SELECT a.user_id,a.email,a.admin_access,u.name FROM email_sessions s JOIN email_accounts a ON a.user_id=s.user_id JOIN users u ON u.id=a.user_id WHERE s.token_hash=? AND s.expires_at>? AND s.account_version=a.version').bind(await digest(raw),Date.now()).first<{user_id:string;email:string;admin_access:number;name:string}>();
 return row?{id:row.user_id,email:row.email,name:row.name,admin:row.admin_access===1&&!!adminEmail()&&row.email===adminEmail(),provider:'email'}:null;
}
export async function emailLoginLinked(userId:string){return !!await db().prepare('SELECT user_id FROM email_accounts WHERE user_id=?').bind(userId).first();}
async function limited(req:Request,kind:string,address:string){
 await db().prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('auth_rate_salt',?)").bind(token()).run();
 const salt=(await db().prepare("SELECT value FROM settings WHERE key='auth_rate_salt'").first<{value:string}>())!.value;
 const hour=Math.floor(Date.now()/3600000),ip=req.headers.get('CF-Connecting-IP')||'unknown';
 for(const [subject,max] of [[address,kind==='login'?12:5],['ip:'+ip,40]] as const){const key='auth:'+await digest(salt+':'+kind+':'+hour+':'+subject);const row=await db().prepare('INSERT INTO request_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(key,(hour+2)*3600000,max).first();if(!row)return true;}
 return false;
}
async function startSession(userId:string,version:number){
 const raw=token(),now=Date.now();await db().prepare('INSERT INTO email_sessions (token_hash,user_id,account_version,created_at,expires_at) VALUES (?,?,?,?,?)').bind(await digest(raw),userId,version,now,now+AGE*1000).run();
 await db().batch([
  db().prepare('DELETE FROM email_sessions WHERE token_hash IN (SELECT token_hash FROM email_sessions WHERE expires_at<=? LIMIT 100)').bind(now),
  db().prepare('DELETE FROM email_sessions WHERE user_id=? AND token_hash NOT IN (SELECT token_hash FROM email_sessions WHERE user_id=? ORDER BY created_at DESC,token_hash DESC LIMIT 10)').bind(userId,userId)
 ]);
 return cookie(raw);
}
export async function authRoute(req:Request,path:string[]):Promise<Response|null>{
 if(path[0]!=='auth')return null;
 if(path.length!==2||!['register','login','logout','recover','link'].includes(path[1]))return response({error:'notFound'},404);
 if(req.method!=='POST')return response({error:'methodNotAllowed'},405);
 if(req.headers.get('origin')!==new URL(req.url).origin)return response({error:'forbidden'},403);
 if(path[1]==='logout'){const raw=sessionToken(req);if(raw)await db().prepare('DELETE FROM email_sessions WHERE token_hash=?').bind(await digest(raw)).run();return response({ok:true},200,cookie('',0));}
 const body=await readBody(req);if(!body)return response({error:'invalid'},400);
 const kind=path[1],platform=platformIdentity(req);
 if(kind==='link'&&!platform)return response({error:'signin'},401);
 const address=kind==='link'?email(platform!.email):email(body.email);
 if(!address)return response({error:'invalidEmail'},400);
 if(await limited(req,kind,address))return response({error:'rateLimit'},429);
 const account=await db().prepare('SELECT a.*,u.name FROM email_accounts a JOIN users u ON u.id=a.user_id WHERE a.email=?').bind(address).first<Account>();
 if(kind==='login'){
  if(typeof body.password!=='string'||body.password.length>128)return response({error:'invalidCredentials'},401);
  const hash=await passwordHash(body.password,account?.salt||'botstore-nonexistent-account-salt');
  if(!account||!sameHash(hash,account.password_hash))return response({error:'invalidCredentials'},401);
  return response({ok:true},200,await startSession(account.user_id,account.version));
 }
 if(!validPassword(body.password))return response({error:'passwordPolicy'},400);
 if(kind==='recover'){
  const code=typeof body.recoveryCode==='string'?body.recoveryCode.trim().toLowerCase():'';
  if(!/^[0-9a-f]{64}$/.test(code)||!account||!sameHash(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(code))),account.recovery_hash))return response({error:'invalidRecovery'},401);
  const salt=randomBytes(16).toString('hex'),recoveryCode=token(),newHash=hex(await passwordHash(body.password,salt));
  const updated=await db().prepare('UPDATE email_accounts SET salt=?,password_hash=?,recovery_hash=?,version=version+1,updated_at=? WHERE user_id=? AND version=? AND recovery_hash=?').bind(salt,newHash,await digest(recoveryCode),Date.now(),account.user_id,account.version,account.recovery_hash).run();
  if(!updated.meta.changes)return response({error:'invalidRecovery'},401);
  await db().prepare('DELETE FROM email_sessions WHERE user_id=? AND account_version<>?').bind(account.user_id,account.version+1).run();
  return response({ok:true,recoveryCode},200,await startSession(account.user_id,account.version+1));
 }
 if(body.consent!==true)return response({error:'authConsentRequired'},400);
 if(account)return response({error:'emailAlreadyUsed'},409);
 if(kind==='register'&&(address===adminEmail()||await db().prepare("SELECT id FROM users WHERE lower(email)=? AND id NOT LIKE 'email:%' LIMIT 1").bind(address).first()))return response({error:'useExistingAccount'},409);
 const name=kind==='link'?platform!.name:typeof body.name==='string'?body.name.trim():'';
 if(name.length<2||name.length>100)return response({error:'invalid'},400);
 const userId=kind==='link'?platform!.id:'email:'+crypto.randomUUID();
 if(await emailLoginLinked(userId))return response({error:'emailAlreadyUsed'},409);
 const now=Date.now(),salt=randomBytes(16).toString('hex'),recoveryCode=token(),hash=hex(await passwordHash(body.password,salt));
 try{
  await db().batch([
   db().prepare('INSERT INTO users (id,email,name,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(userId,address,name,now),
   db().prepare('INSERT INTO email_accounts (user_id,email,salt,password_hash,recovery_hash,admin_access,version,created_at,updated_at) VALUES (?,?,?,?,?,?,1,?,?)').bind(userId,address,salt,hash,await digest(recoveryCode),kind==='link'&&platform!.admin?1:0,now,now)
  ]);
 }catch(error){if(String(error).includes('UNIQUE constraint'))return response({error:'emailAlreadyUsed'},409);throw error;}
 return response({ok:true,recoveryCode},200,await startSession(userId,1));
}
