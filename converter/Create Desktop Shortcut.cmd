@echo off
rem Green Convert - puts a "Green Convert" icon on your Windows desktop that
rem launches the app. Run this once, from the folder the app lives in.
setlocal
cd /d "%~dp0"

if not exist "%~dp0Start Green Convert.cmd" (
  echo Could not find "Start Green Convert.cmd" next to this file.
  echo Keep the app folder together and run this again.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1"
pause
