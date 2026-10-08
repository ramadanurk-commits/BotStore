"""BotStore appointment bot. Python 3.10+. One booking per time slot, UTC+5."""
import json,os,time,sqlite3,urllib.request,logging
from datetime import datetime,timedelta,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parent
CONFIG=json.loads((ROOT/'config.json').read_text(encoding='utf-8'))
TOKEN=os.environ.get('BOT_TOKEN','')
ADMIN=CONFIG.get('adminChatId','')
TZ=timezone(timedelta(hours=5))
LANG=CONFIG.get('language','kk')
TEXTS={
'kk':dict(welcome='Сәлем! Қызметті таңдаңыз:',date='Күнді таңдаңыз:',time='Бос уақытты таңдаңыз:',phone='Көлік маркасын және байланыс телефоныңызды жазыңыз:',done='Жазылу расталды',busy='Бұл уақыт бос емес. /start арқылы басқа уақытты таңдаңыз.',invalid='Қайта бастау үшін /start басыңыз.',mine='Сіздің жазылуларыңыз:',cancel='Жазылуды болдырмау',cancelled='Жазылу тоқтатылды.',none='Белсенді жазылу жоқ.',contact='Телефон мен көлік туралы ақпаратты жазыңыз (8–150 таңба).'),
'ru':dict(welcome='Здравствуйте! Выберите услугу:',date='Выберите день:',time='Выберите свободное время:',phone='Напишите марку машины и контактный телефон:',done='Запись подтверждена',busy='Это время уже занято. Выберите другое через /start.',invalid='Начните заново: /start',mine='Ваши записи:',cancel='Отменить запись',cancelled='Запись отменена.',none='Нет активных записей.',contact='Укажите телефон и автомобиль (8–150 символов).'),
'en':dict(welcome='Welcome! Choose a service:',date='Choose a date:',time='Choose an available time:',phone='Send your vehicle model and contact phone number:',done='Booking confirmed',busy='This time is no longer available. Choose another with /start.',invalid='Start again: /start',mine='Your bookings:',cancel='Cancel booking',cancelled='Booking cancelled.',none='No active bookings.',contact='Enter a phone number and vehicle (8–150 characters).')}
T=TEXTS.get(LANG,TEXTS['kk']).copy()
if CONFIG.get('sector') in ('salon','studio'):
 T['phone']={'kk':'Атыңызды және байланыс телефоныңызды жазыңыз:','ru':'Напишите имя и контактный телефон:','en':'Send your name and contact phone number:'}.get(LANG,'Send your name and phone number:')
 T['contact']={'kk':'Атыңыз бен телефоныңызды жазыңыз (8–150 таңба).','ru':'Укажите имя и телефон (8–150 символов).','en':'Enter your name and phone (8–150 characters).'}.get(LANG,'Enter your name and phone.')
DB=sqlite3.connect(ROOT/'bookings.sqlite3')
DB.executescript('CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY,chat INTEGER NOT NULL,slot TEXT NOT NULL,service TEXT NOT NULL,contact TEXT NOT NULL,status TEXT NOT NULL); CREATE UNIQUE INDEX IF NOT EXISTS booked_slot ON bookings(slot) WHERE status="booked"; CREATE TABLE IF NOT EXISTS sessions(chat INTEGER PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);')
def api(method,data):
 req=urllib.request.Request('https://api.telegram.org/bot'+TOKEN+'/'+method,data=json.dumps(data).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=40) as r:res=json.load(r)
 if not res.get('ok'):raise RuntimeError('Telegram API error')
 return res['result']
def send(chat,text,buttons=None):
 data={'chat_id':chat,'text':text[:4000]}
 if buttons:data['reply_markup']={'inline_keyboard':buttons}
 return api('sendMessage',data)
def save(chat,data):
 DB.execute('INSERT INTO sessions(chat,data) VALUES(?,?) ON CONFLICT(chat) DO UPDATE SET data=excluded.data',(chat,json.dumps(data)));DB.commit()
def session(chat):
 row=DB.execute('SELECT data FROM sessions WHERE chat=?',(chat,)).fetchone();return json.loads(row[0]) if row else {}
def button(text,value):return {'text':text,'callback_data':value}
def start(chat):
 save(chat,{})
 send(chat,CONFIG['businessName']+'\n'+T['welcome'],[[button(s['name']+' · '+str(s['price'])+' ₸','s:'+str(i))] for i,s in enumerate(CONFIG['services'])])
def mine(chat):
 rows=DB.execute('SELECT id,slot,service FROM bookings WHERE chat=? AND status="booked" AND slot>? ORDER BY slot',(chat,datetime.now(TZ).strftime('%Y-%m-%d %H:%M'))).fetchall()
 if not rows:send(chat,T['none']);return
 for id,slot,service in rows:send(chat,service+'\n'+slot,[[button(T['cancel'],'c:'+str(id))]])
def handle(update):
 q=update.get('callback_query')
 if q:
  if q.get('message',{}).get('chat',{}).get('type')!='private':return
  chat=q['from']['id'];value=q.get('data','');api('answerCallbackQuery',{'callback_query_id':q['id']});state=session(chat)
  if value.startswith('c:'):
   try:id=int(value[2:])
   except ValueError:return
   row=DB.execute('SELECT slot,service FROM bookings WHERE id=? AND chat=? AND status="booked"',(id,chat)).fetchone()
   DB.execute('UPDATE bookings SET status="cancelled" WHERE id=? AND chat=?',(id,chat));DB.commit();send(chat,T['cancelled'])
   if row and ADMIN:
    try:send(ADMIN,'CANCELLED / ОТМЕНА / ТОҚТАТЫЛДЫ\n'+row[0]+'\n'+row[1])
    except Exception:logging.warning('Admin notification failed')
   return
  if value.startswith('s:'):
   try:i=int(value[2:])
   except ValueError:return
   if i<0 or i>=len(CONFIG['services']):return
   save(chat,{'service':i});send(chat,T['date'],[[button((datetime.now(TZ)+timedelta(days=d)).strftime('%d.%m'), 'd:'+(datetime.now(TZ)+timedelta(days=d)).strftime('%Y-%m-%d'))] for d in range(7)]);return
  if value.startswith('d:') and 'service' in state:
   day=value[2:];allowed={(datetime.now(TZ)+timedelta(days=d)).strftime('%Y-%m-%d') for d in range(7)}
   if day not in allowed:send(chat,T['invalid']);return
   state['day']=day;state.pop('slot',None);save(chat,state);used={r[0] for r in DB.execute('SELECT slot FROM bookings WHERE status="booked"').fetchall()};slots=[h for h in CONFIG['hours'] if day+' '+h not in used and day+' '+h>datetime.now(TZ).strftime('%Y-%m-%d %H:%M')]
   send(chat,T['time'] if slots else T['busy'],[[button(h,'t:'+h)] for h in slots] if slots else None);return
  if value.startswith('t:') and 'day' in state and 'service' in state:
   hour=value[2:]
   if hour not in CONFIG['hours']:return
   state['slot']=state['day']+' '+hour;save(chat,state);send(chat,T['phone']);return
  send(chat,T['invalid']);return
 msg=update.get('message',{})
 if msg.get('chat',{}).get('type')!='private':return
 chat=msg['chat']['id'];text=msg.get('text','').strip()
 if text=='/id':send(chat,str(chat));return
 if text.startswith('/start'):start(chat);return
 if text in ['/my','/cancel']:mine(chat);return
 state=session(chat)
 if 'slot' not in state:send(chat,T['invalid']);return
 if len(text)<8 or len(text)>150 or sum(c.isdigit() for c in text)<7:send(chat,T['contact']);return
 if state['slot']<=datetime.now(TZ).strftime('%Y-%m-%d %H:%M'):send(chat,T['busy']);return
 service=CONFIG['services'][state['service']];id=update['update_id']
 try:
  DB.execute('INSERT INTO bookings(id,chat,slot,service,contact,status) VALUES(?,?,?,?,?,"booked")',(id,chat,state['slot'],service['name'],text));DB.commit()
 except sqlite3.IntegrityError:
  existing=DB.execute('SELECT id FROM bookings WHERE id=? AND chat=?',(id,chat)).fetchone()
  if not existing:send(chat,T['busy']);return
 save(chat,{})
 send(chat,T['done']+' ✓\n'+service['name']+' · '+str(service['price'])+' ₸\n'+state['slot']+' (UTC+5)',[[button(T['cancel'],'c:'+str(id))]])
 if ADMIN:
  try:send(ADMIN,'NEW BOOKING / НОВАЯ ЗАПИСЬ / ЖАҢА ЖАЗЫЛУ\n'+state['slot']+'\n'+service['name']+'\n'+text)
  except Exception:logging.warning('Admin notification failed: check ADMIN chat has started the bot')
def main():
 if not TOKEN:raise SystemExit('Set BOT_TOKEN or use start.bat / start.sh')
 api('getMe',{});webhook=api('getWebhookInfo',{})
 if webhook.get('url'):raise SystemExit('This bot has a webhook. Use a new bot or remove the previous webhook intentionally before polling.')
 row=DB.execute('SELECT value FROM meta WHERE key="offset"').fetchone();offset=int(row[0]) if row else 0
 print('BotStore booking bot running. Ctrl+C to stop.')
 while True:
  try:
   for update in api('getUpdates',{'offset':offset,'timeout':25,'allowed_updates':['message','callback_query']}):
    try:handle(update)
    except Exception:logging.warning('Update processing failed. Check connectivity and configuration.')
    offset=update['update_id']+1;DB.execute('INSERT INTO meta(key,value) VALUES("offset",?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',(str(offset),));DB.commit()
  except KeyboardInterrupt:break
  except Exception:logging.warning('Connection unavailable, retrying');time.sleep(5)
if __name__=='__main__':main()
