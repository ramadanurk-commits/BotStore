@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22.13 or newer, then reopen this file.
  echo https://nodejs.org/
  pause
  exit /b 1
)
node scripts\desktop-start.mjs
if errorlevel 1 pause
