#!/usr/bin/env bash
cd -- "$(dirname -- "$0")"
read -r -s -p 'Telegram bot token (do not share): ' BOT_TOKEN
printf '\n'
export BOT_TOKEN
python3 bot.py
