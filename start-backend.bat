@echo off
title PulseChat - Backend
cd /d "%~dp0backend"
echo.
echo === Starting PulseChat Backend ===
echo MongoDB must be running on localhost:27017
echo API will be at http://YOUR_LAN_IP:5000
echo.
npm run dev
