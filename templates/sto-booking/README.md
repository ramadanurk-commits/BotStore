# BotStore — STO Booking

ҚАЗАҚША
1. Python 3.10+ орнатыңыз. ZIP архивін жеке папкаға ашыңыз.
2. Telegram @BotFather арқылы жаңа бот ашыңыз.
3. Windows: start.bat. macOS/Linux: bash start.sh. Токенді тек өз компьютеріңізде енгізіңіз.
4. Ботқа /id жазыңыз. Өз нөміріңізді config.json ішіндегі adminChatId өрісіне немесе сайттағы орнату шеберіне қосыңыз. Қайта іске қосыңыз.
5. Клиент /start → қызмет → күн → бос уақыт → көлік пен телефон жазады. /my немесе /cancel арқылы жазылуды басқарады.
6. Компьютер/сервер үнемі қосулы болуы керек. Хостинг және төлем қабылдау кірмейді. Бір слотқа бір көлік, уақыт белдеуі UTC+5. Алдағы 7 күн көрсетіледі. Қызметтер ұзақтығын слоттарды таңдағанда ескеріңіз.

РУССКИЙ
1. Установите Python 3.10+, распакуйте ZIP.
2. Создайте нового бота через @BotFather.
3. Запустите start.bat (Windows) или bash start.sh (macOS/Linux). Введите токен на своём компьютере. BotStore не сохраняет токен.
4. Отправьте /id своему боту. Укажите полученный ID в adminChatId в config.json или мастере настройки, перезапустите.
5. Клиент выбирает услугу, день и слот, вводит автомобиль и телефон. /my и /cancel показывают записи и отмену. Одновременно слот бронируется только один раз.
6. Компьютер или сервер должен работать постоянно. Хостинг и приём платежей не включены. Часовой пояс UTC+5, расписание на 7 дней, одна машина на слот. Задайте интервалы с учётом длительности работ.

ENGLISH
1. Install Python 3.10+ and extract ZIP.
2. Create a new bot with @BotFather.
3. Run start.bat (Windows) or bash start.sh (macOS/Linux). Enter the token locally; BotStore never stores it.
4. Send /id to your bot. Add the result as adminChatId in config.json or in the setup wizard. Restart.
5. Customer flow: /start → service → day → available slot → vehicle and phone. /my and /cancel allow viewing/cancelling bookings.
6. An always-running computer/server is required. Hosting and payments are not included. UTC+5, next 7 days, one vehicle per slot. Space slots to accommodate your service duration.

Data is stored locally in bookings.sqlite3. Back up this file privately. Do not share it with customers or commit it to a public repository. Do not run two bot instances at once. MIT license; provided as-is without warranty.
