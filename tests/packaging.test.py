"""Verify paid download payloads and business-specific runnable Python bundles."""
from pathlib import Path
import json,base64,zipfile,io,tempfile,importlib.util
bundles=json.loads(Path('lib/bundles.ts').read_text().split(' = ',1)[1].rstrip(';\n'))
for sector in ['sto','salon','shop','studio']:
 with zipfile.ZipFile(io.BytesIO(base64.b64decode(bundles['builtin:pack-'+sector]))) as z:
  assert z.testzip() is None
  names=z.namelist()
  assert {'START-HERE.md','sheets-crm/Code.gs','business-website/index.html'}<=set(names)
  assert not any(name.endswith(('.sqlite3','.pyc')) or '__pycache__' in name for name in names)
  if sector=='shop':
   compile(z.read('telegram-orders/bot.py'),'bot.py','exec')
  else:
   cfg=json.loads(z.read('sto-booking/config.json'));assert cfg['sector']==sector
   with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    for name in ['bot.py','config.json']:(root/name).write_bytes(z.read('sto-booking/'+name))
    spec=importlib.util.spec_from_file_location('booking_'+sector,root/'bot.py');bot=importlib.util.module_from_spec(spec);spec.loader.exec_module(bot)
    assert len(bot.CONFIG['services'])>=1
    if sector in ['salon','studio']:assert 'Атыңызды' in bot.T['phone']
    bot.DB.close()
with zipfile.ZipFile('.sites-runtime/pack-salon.zip') as z:
 assert json.loads(z.read('sto-booking/config.json'))['sector']=='salon'
 assert z.testzip() is None
with zipfile.ZipFile('.sites-runtime/pack-configured.zip') as z:
 cfg=json.loads(z.read('sto-booking/config.json'))
 assert cfg['businessName']=='Test Salon' and cfg['sector']=='salon'
 assert 'sheets-crm/Code.gs' in z.namelist() and 'business-website/index.html' in z.namelist()
 assert z.testzip() is None
print('PASS: four complete business ZIPs, salon/studio prompts, paid bundle and customized archive contents')
