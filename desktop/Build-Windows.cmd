@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or newer, then run this file again.
  pause
  exit /b 1
)
call npm.cmd install --no-audit --no-fund
if errorlevel 1 goto failed
call npm.cmd test
if errorlevel 1 goto failed
call npm.cmd run dist
if errorlevel 1 goto failed
echo.
echo VAL installer ready in the dist folder.
start "" explorer.exe "%~dp0dist"
pause
exit /b 0
:failed
echo.
echo Build stopped. Check the error above. No installer has been verified.
pause
exit /b 1
