import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const { loadEnvConfig }=createRequire(require.resolve('next'))('@next/env');
const command=process.argv[2];
if(!['build','dev','start'].includes(command))throw new Error('Expected build, dev or start.');
loadEnvConfig(process.cwd(),command==='dev');
process.env.BOTSTORE_RUNTIME='vercel';
process.env.NEXT_TELEMETRY_DISABLED='1';
if(!process.env.BOTSTORE_BACKEND_SERVICE_TOKEN?.trim()){
 console.error('Set BOTSTORE_BACKEND_SERVICE_TOKEN in the protected Vercel environment before starting this deployment. See docs/vercel-vscode.md.');
 process.exit(1);
}
const cli=new URL('../node_modules/next/dist/bin/next',import.meta.url);
process.argv=[process.execPath,fileURLToPath(cli),command,...(command==='build'||command==='dev'?['--webpack']:[]),...process.argv.slice(3)];
await import(cli.href);
