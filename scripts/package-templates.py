from pathlib import Path
import zipfile,io,base64,json
root=Path(__file__).resolve().parents[1]
bundles={}; source={}
for folder in sorted((root/'templates').iterdir()):
 if folder.is_dir():
  source[folder.name]={str(f.relative_to(folder)):f.read_text() for f in sorted(folder.rglob('*')) if f.is_file() and not any(part.startswith('.') or part=='__pycache__' for part in f.relative_to(folder).parts) and f.suffix not in ('.pyc','.sqlite3')}
for sector in ['sto','salon','shop','studio']:
 bot='telegram-orders' if sector=='shop' else 'sto-booking'
 files={f'{name}/{path}':content for name in [bot,'sheets-crm','business-website'] for path,content in source[name].items()}
 if sector!='shop':
  config=json.loads(source[bot]['config.json']);config['sector']=sector
  if sector=='salon':config.update(businessName='My Salon',services=[{'name':'Шаш қию / Стрижка / Haircut','price':5000},{'name':'Маникюр / Manicure','price':7000}])
  if sector=='studio':config.update(businessName='My Studio',services=[{'name':'Фотосессия / Photo session','price':15000}],hours=['09:00','11:00','14:00','16:00'])
  files[f'{bot}/config.json']=json.dumps(config,ensure_ascii=False,indent=2)
  if sector in ['salon','studio']:
   files[f'{bot}/README.md']=source[bot]['README.md'].replace('STO Booking','Appointment Booking').replace('көлік пен телефон','аты мен телефон').replace('бір көлік','бір клиент').replace('автомобиль и телефон','имя и телефон').replace('одна машина','один клиент').replace('vehicle and phone','name and phone').replace('one vehicle','one customer')
 files['START-HERE.md']=f'''# BotStore · {sector}

## Қазақша
Бұл пакетте үш бөлек құрал бар: `{bot}`, `sheets-crm`, `business-website`.
Әр қалтадағы README нұсқаулығын оқыңыз. Алдымен боттың баптауларын өзгертіп, тестілік тапсырысты өзіңіз тексеріңіз; кейін Google Sheets CRM мен сайтты орнатыңыз. Салон мен студия боты клиенттің аты мен телефонын сұрайды.
Python 3.10+, Telegram бот токені және Google аккаунт қажет. Токенді жарияламаңыз. Бот компьютер/сервер қосулы кезде жұмыс істейді. Құралдар арасында автоматты синхрондау жоқ. Бағалар мен қызметтер — өзгертуге арналған мысалдар. Бір слотқа бір жазылу; UTC+5. Қызмет ұзақтығы және бірнеше қызметкердің кестесі автоматты есептелмейді. Хостинг, домен және орнату қызметі бөлек келісіледі.

## Русский
В пакете три отдельных инструмента: `{bot}`, `sheets-crm`, `business-website`.
Читайте README в каждой папке. Сначала настройте и проверьте бота тестовым заказом, затем установите CRM и сайт. Варианты для салона и студии спрашивают имя и телефон клиента.
Нужны Python 3.10+, токен Telegram-бота и Google-аккаунт. Не публикуйте токен. Бот работает, пока включён компьютер/сервер. Автоматической синхронизации нет. Услуги и цены — редактируемые примеры. Одна запись на слот; UTC+5. Длительности услуг и расписание нескольких сотрудников автоматически не рассчитываются. Хостинг, домен и помощь с установкой согласуются отдельно.

## English
Three separate tools: `{bot}`, `sheets-crm`, `business-website`.
Read the README in each folder. Configure and test the bot first, then set up the CRM and website. Salon and studio variants ask for the customer's name and phone.
Requires Python 3.10+, a Telegram token and a Google account. Keep the token private. The bot needs a running computer/server. Tools do not sync automatically. Services and prices are editable examples. One appointment per slot; UTC+5. Service durations and multiple staff schedules are not calculated automatically. Hosting, domain and installation service are arranged separately.
'''
 if sector=='shop':
  for phrase in ['Бір слотқа бір жазылу; UTC+5. Қызмет ұзақтығы және бірнеше қызметкердің кестесі автоматты есептелмейді. ', 'Одна запись на слот; UTC+5. Длительности услуг и расписание нескольких сотрудников автоматически не рассчитываются. ', 'One appointment per slot; UTC+5. Service durations and multiple staff schedules are not calculated automatically. ']:files['START-HERE.md']=files['START-HERE.md'].replace(phrase,'')
 source['pack-'+sector]=files
for name,files in source.items():
 buffer=io.BytesIO()
 with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as z:
  for path,content in sorted(files.items()):
   info=zipfile.ZipInfo(path,(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
   z.writestr(info,content.encode())
 bundles['builtin:'+name]=base64.b64encode(buffer.getvalue()).decode()
(root/'lib/bundles.ts').write_text('export const bundles:Record<string,string> = '+json.dumps(bundles)+';\n')
(root/'lib/sto-files.ts').write_text('export const stoFiles:Record<string,string> = '+json.dumps(source['sto-booking'],ensure_ascii=False)+';\n')
(root/'lib/install-files.ts').write_text('export const installFiles:Record<string,Record<string,string>> = '+json.dumps({name:source[name] for name in ['sto-booking','pack-sto','pack-salon','pack-studio']},ensure_ascii=False)+';\n')
