#!/bin/bash
# Sadaf Clinic - 1-Click Desktop App Launcher
echo "🚀 Sadaf Clinic Desktop ilovasi ishga tushirilmoqda..."
cd "$(dirname "$0")/Desktop-App" || exit 1
env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/electron .

