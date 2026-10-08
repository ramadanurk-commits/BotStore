import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'BotStore — Бизнеске дайын шешімдер',description:'Telegram bots, Google Sheets automation and websites for businesses in Kazakhstan.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="kk"><body>{children}</body></html>}
