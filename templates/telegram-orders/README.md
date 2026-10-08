# BotStore

License / Лицензия: MIT. You may use and modify this template commercially. Provided as-is without warranty.

ҚАЗАҚША
Файлдарды жеке папкаға ашыңыз. Өз бизнесіңіздің деректерін енгізіп, алдымен сынақтан өткізіңіз. Құпия токендерді жарияламаңыз.

РУССКИЙ
Распакуйте файлы в отдельную папку. Укажите данные своего бизнеса и протестируйте перед запуском. Не публикуйте секретные токены.

ENGLISH
Extract to a folder, configure your business details and test before launch. Keep secret tokens private.

## Telegram / Python 3.10+
1. @BotFather арқылы / Create a bot using / Создайте бота через @BotFather.
2. Set BOT_TOKEN environment variable.
PowerShell: $env:BOT_TOKEN="your_token"
macOS/Linux: export BOT_TOKEN="your_token"
3. Run: python bot.py
4. Send /id to the bot from your admin account. Stop the script. Set ADMIN_CHAT_ID to the returned ID.
5. Set BUSINESS_NAME and BOT_LANG (kk, ru, en) if desired. Run python bot.py again.
6. Send an order from a second account. The admin receives it and the customer receives confirmation.

The process must keep running on your computer or server. Hosting is not included. This template uses polling; turn off any existing webhook before use. Does not process payments or store orders in a database.
ҚАЗ: Python іске қосулы тұруы керек. /id арқылы өз chat ID-іңізді алып, ADMIN_CHAT_ID енгізіңіз. Төлем мен база қосылмаған.
РУС: Скрипт должен работать постоянно. Получите свой chat ID командой /id и задайте ADMIN_CHAT_ID. Платежи и база данных не включены.
