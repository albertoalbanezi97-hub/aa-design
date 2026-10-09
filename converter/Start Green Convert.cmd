@echo off
rem Green Convert - starts a small local web server in this folder, then opens
rem the app in your default browser. A minimised "Green Convert server" window
rem stays open while the app runs; close it to stop the app.
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "PORT=8765"
set "URL=http://localhost:%PORT%/index.html"

rem Already running on this port? Just open the browser again.
netstat -an | findstr /c:":%PORT%" | findstr /i "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  echo Green Convert is already running - opening the browser.
  start "" "%URL%"
  exit /b 0
)

rem Find something that can serve the folder. "py" is checked first because a
rem bare "python" on Windows is often the Microsoft Store placeholder.
set "SERVER="

where py >nul 2>&1
if !errorlevel!==0 set "SERVER=py -3 -m http.server %PORT%"

if not defined SERVER (
  where python >nul 2>&1
  if !errorlevel!==0 set "SERVER=python -m http.server %PORT%"
)

if not defined SERVER (
  where npx >nul 2>&1
  if !errorlevel!==0 set "SERVER=npx --yes http-server -p %PORT% -s"
)

if not defined SERVER (
  echo.
  echo Neither Python nor Node was found on this PC.
  echo.
  echo Opening the app directly instead. It will still convert, compress, crop
  echo and download normally - but saving into an output folder, and installing
  echo the app to your desktop, both need a local server.
  echo.
  echo To get the full version install Python from
  echo     https://www.python.org/downloads/
  echo tick "Add python.exe to PATH" during setup, then run this file again.
  echo.
  start "" "%~dp0index.html"
  pause
  exit /b 0
)

echo Starting Green Convert at %URL%
echo Leave the minimised server window open while you use the app.
start "Green Convert server" /min cmd /c "!SERVER!"

rem Give the server a moment to come up, then open the browser.
ping -n 3 127.0.0.1 >nul 2>&1
start "" "%URL%"
exit /b 0
