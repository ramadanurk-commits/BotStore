"""BotStore order bot. Python 3.10+, standard library only."""
import json, os, time, urllib.request, urllib.error, logging
TOKEN = os.environ.get('BOT_TOKEN', '')
ADMIN_CHAT_ID = os.environ.get('ADMIN_CHAT_ID', '')
BUSINESS_NAME = os.environ.get('BUSINESS_NAME', 'My business')
LANG = os.environ.get('BOT_LANG', 'kk')
COPY = {
 'kk': ['Сәлем! Тапсырысыңызды және байланыс телефоныңызды бір хабарламада жазыңыз.', 'Тапсырысыңыз қабылданды. Біз сізбен байланысамыз.', 'Әзірге тек мәтіндік тапсырыс жіберіңіз.', 'Қате орын алды. Біраздан кейін қайталап көріңіз.'],
 'ru': ['Здравствуйте! Отправьте заказ и номер телефона одним сообщением.', 'Заказ принят. Мы свяжемся с вами.', 'Пожалуйста, отправьте заказ текстом.', 'Ошибка доставки. Попробуйте позже.'],
 'en': ['Welcome! Send your order and phone number in one message.', 'Order received. We will contact you.', 'Please send a text order.', 'Delivery failed. Please try again later.']
}
TEXT = COPY.get(LANG, COPY['kk'])
def api(method, payload):
 req = urllib.request.Request('https://api.telegram.org/bot'+TOKEN+'/'+method,data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=40) as res:
  data=json.load(res)
 if not data.get('ok'): raise RuntimeError('Telegram API rejected request')
 return data['result']
def send(chat, text):
 return api('sendMessage', {'chat_id':chat,'text':text[:4000]})
def handle(msg):
 if msg.get('chat',{}).get('type')!='private': return
 chat=msg['chat']['id']; text=msg.get('text','').strip()
 if text=='/id': send(chat, str(chat)); return
 if text.startswith('/start'): send(chat, BUSINESS_NAME+'\n\n'+TEXT[0]); return
 if not text: send(chat,TEXT[2]); return
 if not ADMIN_CHAT_ID: send(chat, TEXT[3]); return
 user=msg.get('from',{}); username=user.get('username','')
 send(ADMIN_CHAT_ID, 'New order / Жаңа тапсырыс / Новый заказ\n'+BUSINESS_NAME+'\nChat ID: '+str(chat)+'\n@'+username+'\n\n'+text[:3000])
 send(chat,TEXT[1])
def main():
 if not TOKEN: raise SystemExit('Set BOT_TOKEN first. See README.md')
 offset=0
 api('getMe',{})
 logging.info('Bot is running. Press Ctrl+C to stop.')
 while True:
  try:
   updates=api('getUpdates',{'offset':offset,'timeout':25,'allowed_updates':['message']})
   for update in updates:
    try: handle(update.get('message',{}))
    except Exception: logging.warning('Message processing failed; check admin ID and connectivity')
    offset=update['update_id']+1
  except KeyboardInterrupt: break
  except Exception: logging.warning('Connection failed; retrying in 5 seconds');time.sleep(5)
if __name__=='__main__':
 logging.basicConfig(level=logging.INFO);main()
