#!/bin/bash
# PulseChat Android APK Builder (Expo SDK 54)
#   [1] EAS cloud build  -> download link
#   [2] Local gradle build -> android/app/build/outputs/apk/release/app-release.apk

set -e

cd "$(dirname "$0")"

echo "========================================================"
echo "        PULSECHAT REAL-TIME CHAT APK BUILDER"
echo "========================================================"
echo ""
echo "  [1] Expo EAS Cloud Build (needs a free Expo account)"
echo "  [2] Local Gradle Build (needs JDK 17 + Android SDK)"
echo ""

CHOICE="${1:-}"

if [ -z "$CHOICE" ]; then
  read -r -p "Enter 1 or 2: " CHOICE
fi

if [ "$CHOICE" = "2" ]; then

  npm install

  npx expo prebuild --platform android --clean

  (cd android && ./gradlew assembleRelease)

  echo ""
  echo "APK: $(pwd)/android/app/build/outputs/apk/release/app-release.apk"
  echo "Install with: adb install -r android/app/build/outputs/apk/release/app-release.apk"

  exit 0

fi

npx eas-cli whoami || npx eas-cli login
npx eas-cli build -p android --profile preview

echo ""
echo "Build completed! Download your APK using the generated link above."
