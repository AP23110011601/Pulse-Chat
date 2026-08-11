@echo off
REM PulseChat Automated Android APK Builder Script
REM Option 1: Expo EAS Cloud Build (Recommended - Free & Fast)
REM Option 2: Local Gradle Build (Requires Android SDK & JDK installed)

cd /d "%~dp0"

echo ========================================================
echo         PULSECHAT REAL-TIME CHAT APK BUILDER
echo ========================================================
echo.
echo Choose build method:
echo   [1] Expo EAS Cloud Build (Easiest - generates APK link)
echo   [2] Local Gradle Build (Generates app-release.apk locally)
echo.
set /p CHOICE="Enter 1 or 2: "

if "%CHOICE%"=="2" (
    echo.
    echo Running Local Prebuild and Gradle Build...
    call npx expo prebuild --platform android --clean
    cd android
    call gradlew.bat assembleRelease
    echo.
    echo APK generated at: mobile-app\android\app\build\outputs\apk\release\app-release.apk
    pause
    exit /b
)

echo.
echo Checking Expo Login...
call npx eas-cli whoami
if errorlevel 1 (
    echo.
    echo Please log in to your free Expo account:
    call npx eas-cli login
)

echo.
echo Starting Android APK build on EAS Cloud...
call npx eas-cli build -p android --profile preview

echo.
echo ========================================================
echo Build submitted! When complete, download your APK from the URL shown above.
echo ========================================================
pause
