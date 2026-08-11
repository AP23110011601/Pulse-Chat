@echo off
title PulseChat - Mobile (Expo)
cd /d "%~dp0mobile-app"
echo.
echo === Starting PulseChat Mobile ===
echo Scan the QR code with Expo Go on your phone
echo Phone and PC must be on the same Wi-Fi
echo.
npx expo start
