import Store from './store';
import {chatGPTSignInPath} from './chatgpt-auth';
export default function Page(){return <Store signInPath={chatGPTSignInPath('/#account')}/>}
