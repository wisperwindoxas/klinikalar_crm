@echo off
title Klinika-admin - Oflayn Tizim
echo ==========================================================
echo   Klinika-admin - Oflayn Standalone Tizimi Ishga Tushmoqda
echo   Embedded Database: PGlite (Zero-Postgres, Zero-Config)
echo ==========================================================
cd /d %~dp0
set DATA_DIR=%~dp0data\clinic_offline_pgdata
set OFFLINE_MODE=true
set PORT=5001

cd Desktop-App
npx electron .

