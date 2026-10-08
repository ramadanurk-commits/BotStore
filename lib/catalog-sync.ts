import {db} from './db';
import {businessPacks} from './catalog';
// Add new built-ins once without overwriting existing edits or archived products.
export async function ensureBusinessPacks(){
 if(await db().prepare("SELECT key FROM settings WHERE key='catalog_packs_v1'").first())return;
 const owner=await db().prepare("SELECT owner_id FROM products WHERE id='sto-booking' AND file_key='builtin:sto-booking'").first<{owner_id:string}>();if(!owner)return;
 const now=Date.now();await db().batch([...businessPacks.map(p=>db().prepare('INSERT OR IGNORE INTO products (id,owner_id,category,price,content,status,file_key,filename,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(p.id,owner.owner_id,p.category,p.price,JSON.stringify(p.content),'published',p.file_key,p.filename,now,now)),db().prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('catalog_packs_v1','ready')")]);
}
