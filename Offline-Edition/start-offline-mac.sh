#!/bin/bash
cd "$(dirname "$0")"
echo "=========================================================="
echo "  Klinika-admin — Oflayn Standalone Tizimi Ishga Tushmoqda"
echo "  Embedded Database: PGlite (Zero-Postgres, Zero-Config)"
echo "=========================================================="
export DATA_DIR="$(pwd)/data/clinic_offline_pgdata"
export OFFLINE_MODE=true
export PORT=5001

# Run Desktop App
cd Desktop-App
npx electron .

