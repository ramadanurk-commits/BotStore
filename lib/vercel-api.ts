/** Node.js entry point. It never imports or emulates Cloudflare bindings. */
import { proxyAPI } from './vercel-proxy';

export function handle(request:Request) {
 return proxyAPI(request,{serviceToken:process.env.BOTSTORE_BACKEND_SERVICE_TOKEN});
}
