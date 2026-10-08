"""Run template in a temporary directory with a mocked Telegram transport."""
import tempfile,shutil,importlib.util
from pathlib import Path
from datetime import datetime,timedelta
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp)
 for name in ['bot.py','config.json']:shutil.copy(Path('templates/sto-booking')/name,root/name)
 spec=importlib.util.spec_from_file_location('booking',root/'bot.py');bot=importlib.util.module_from_spec(spec);spec.loader.exec_module(bot)
 sent=[];bot.api=lambda method,data:sent.append((method,data)) or {};bot.ADMIN='999'
 day=(datetime.now(bot.TZ)+timedelta(days=1)).strftime('%Y-%m-%d');hour=bot.CONFIG['hours'][0]
 def click(chat,value):bot.handle({'callback_query':{'id':'test','from':{'id':chat},'message':{'chat':{'type':'private'}},'data':value}})
 def message(chat,text,uid):bot.handle({'update_id':uid,'message':{'chat':{'id':chat,'type':'private'},'text':text}})
 for chat in [1,2]:
  message(chat,'/start',chat);click(chat,'s:0');click(chat,'d:'+day);click(chat,'t:'+hour)
 message(1,'Toyota +77000000001',100)
 message(2,'Toyota +77000000002',101)
 assert bot.DB.execute('SELECT COUNT(*) FROM bookings WHERE status="booked"').fetchone()[0]==1
 click(2,'c:100');assert bot.DB.execute('SELECT status FROM bookings WHERE id=100').fetchone()[0]=='booked'
 click(1,'c:100');message(2,'Toyota +77000000002',102)
 assert bot.DB.execute('SELECT chat FROM bookings WHERE status="booked"').fetchone()[0]==2
 assert any(d.get('chat_id')=='999' for _,d in sent)
 assert bot.DB.execute('SELECT data FROM sessions WHERE chat=2').fetchone()[0]=='{}'
 bot.DB.close()
 print('PASS: booking flow, collision protection, cancellation ownership, slot reuse and admin notice (mocked Telegram)')
