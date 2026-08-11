#!/bin/bash
# PulseChat Automated Android APK Builder Script

cd "$(dirname "$0")"

echo "========================================================"
echo "        PULSECHAT REAL-TIME CHAT APK BUILDER"
echo "========================================================"
echo ""
echo "Starting Android APK build via EAS Cloud..."

npx eas-cli whoami || npx eas-cli login
npx eas-cli build -p android --profile preview

echo ""
echo "Build completed! Download your APK using the generated link above."
