import Store from './store';
import {chatGPTSignInPath} from './chatgpt-auth';
export default function Page(){const vercel=process.env.BOTSTORE_RUNTIME==='vercel';return <Store signInPath={vercel?undefined:chatGPTSignInPath('/#account')} maxUploadBytes={vercel?4*1024*1024:15*1024*1024}/>}
