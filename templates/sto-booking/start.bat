@echo off
cd /d "%~dp0"
set /p BOT_TOKEN=Telegram bot token (do not share): 
python bot.py
pause
