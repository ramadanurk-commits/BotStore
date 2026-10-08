import { env } from 'cloudflare:workers';
export function db():D1Database {const binding=(env as unknown as {DB:D1Database}).DB;if(!binding)throw new Error('Database unavailable');return binding;}
export function bucket():R2Bucket {const binding=(env as unknown as {BUCKET:R2Bucket}).BUCKET;if(!binding)throw new Error('Storage unavailable');return binding;}
export function adminEmail(){return ((env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL||'').trim().toLowerCase()}

export function kaspiTransfer(){const e=env as unknown as Record<string,string>;const card=(e.KASPI_TRANSFER_CARD||'').replace(/\s/g,'');const phone=(e.KASPI_TRANSFER_PHONE||'').replace(/[^0-9]/g,'');return {card:/^\d{16}$/.test(card)?card:'',phone:/^[78]\d{10}$/.test(phone)?phone:''}}
