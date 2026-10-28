#!/bin/bash

echo "=========================================================="
echo "  SADAF CLINIC MANAGEMENT SAAS PLATFORM — ISHGA TUSHIRISH"
echo "=========================================================="

# 1. Backend
echo "Starting Backend API & WebSocket on port 5001..."
cd Backend && npm run build && npm start &
BACKEND_PID=$!

# Wait 2 seconds for backend to initialize
sleep 2

# 2. Super Admin Panel
echo "Starting Super-Admin-Panel on port 3000..."
cd ../Super-Admin-Panel && npm run dev &
SUPER_ADMIN_PID=$!

# 3. User Panel
echo "Starting User-Panel on port 3001..."
cd ../User-Panel && npm run dev &
USER_PANEL_PID=$!

# 4. TV Display
echo "Starting TV-Display on port 3002..."
cd ../TV-Display && npm run dev &
TV_DISPLAY_PID=$!

echo ""
echo "🚀 Barcha servislar muvaffaqiyatli ishga tushirildi:"
echo "   • Backend API:        http://localhost:5001"
echo "   • Super Admin Panel:  http://localhost:3000"
echo "   • User Panel:         http://localhost:3001"
echo "   • TV Display Screen:  http://localhost:3002"
echo ""
echo "To'xtatish uchun: Ctrl + C"

trap "kill $BACKEND_PID $SUPER_ADMIN_PID $USER_PANEL_PID $TV_DISPLAY_PID" EXIT
wait
