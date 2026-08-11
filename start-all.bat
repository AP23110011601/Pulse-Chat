@echo off
echo.
echo === PulseChat - Start All ===
echo.
start "PulseChat Backend" cmd /k "%~dp0start-backend.bat"
timeout /t 3 /nobreak >nul
start "PulseChat Mobile" cmd /k "%~dp0start-mobile.bat"
echo Backend + Mobile windows opened.
echo.
