/** Only this existing Site may receive the Site-scoped service credential. */
export const BACKEND_ORIGIN='https://botstore-kz-market.ra1k0n.chatgpt.site';
export const MAX_PROXY_UPLOAD=4*1024*1024;
const SESSION='__Host-botstore-session';
type Options={serviceToken?:string;fetcher?:typeof fetch};
const error=(message:string,status:number)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

async function boundedBody(request:Request){
 if(Number(request.headers.get('content-length')||0)>MAX_PROXY_UPLOAD)throw new RangeError('tooLarge');
 const reader=request.body?.getReader();if(!reader)return undefined;
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_PROXY_UPLOAD){await reader.cancel();throw new RangeError('tooLarge');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return bytes;
}

export async function proxyAPI(request:Request,{serviceToken,fetcher=fetch}:Options):Promise<Response>{
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/'))return error('notFound',404);
 if(!['GET','HEAD','POST'].includes(request.method))return error('methodNotAllowed',405);
 // Check the browser's real origin BEFORE rewriting it for the upstream API.
 if(request.method==='POST'&&request.headers.get('origin')!==url.origin)return error('forbidden',403);
 if(!serviceToken?.trim())return error('backendNotConfigured',503);
 const target=new URL(BACKEND_ORIGIN);target.pathname=url.pathname;target.search=url.search;
 const headers=new Headers({'Accept':request.headers.get('accept')||'application/json','OAI-Sites-Authorization':'Bearer '+serviceToken});
 // Never forward caller-supplied identity, authorization, host, forwarded or IP headers.
 const sessions=(request.headers.get('cookie')||'').split(';').map(value=>value.trim()).filter(value=>value.startsWith(SESSION+'='));
 if(sessions.length===1&&new RegExp('^'+SESSION+'=[0-9a-f]{64}$').test(sessions[0]))headers.set('Cookie',sessions[0]);
 if(request.headers.has('content-type'))headers.set('Content-Type',request.headers.get('content-type')!);
 if(request.method==='POST')headers.set('Origin',BACKEND_ORIGIN);
 try{
  const body=request.method==='POST'?await boundedBody(request):undefined;
  const upstream=await fetcher(target,{method:request.method,headers,body,redirect:'manual',cache:'no-store',signal:AbortSignal.any([request.signal,AbortSignal.timeout(25000)])});
  // A sign-in wall/redirect is not a successful API response. Never follow it with credentials.
  const type=upstream.headers.get('content-type')||'';
  if(upstream.status>=300&&upstream.status<400||!type.toLowerCase().startsWith('application/json')&&!type.toLowerCase().startsWith('application/zip')){
   await upstream.body?.cancel();return error('backendUnavailable',502);
  }
  const resultHeaders=new Headers({'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  const disposition=upstream.headers.get('content-disposition');if(disposition)resultHeaders.set('Content-Disposition',disposition);
  // Reissue only the application's host-only session cookie on the Vercel domain.
  for(const cookie of upstream.headers.getSetCookie()){
   if(new RegExp('^'+SESSION+'=(?:[0-9a-f]{64})?;').test(cookie)&&!/(?:^|;)\s*Domain\s*=/i.test(cookie))resultHeaders.append('Set-Cookie',cookie);
  }
  return new Response(request.method==='HEAD'?null:upstream.body,{status:upstream.status,headers:resultHeaders});
 }catch(e){
  if(e instanceof RangeError)return error('tooLargeVercel',413);
  // Error details could contain credentials/URLs. Send only a stable public key.
  return error('backendUnavailable',502);
 }
}
