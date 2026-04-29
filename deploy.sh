#!/bin/bash
# =====================================================
# KAIDO SOLAR - Deploy Script cho VPS Ubuntu/Debian
# Chạy lệnh này trên VPS sau khi clone dự án
# =====================================================

set -e

echo "🚀 Bắt đầu deploy Kaido Solar..."

# 1. Cài Node.js 20 nếu chưa có
if ! command -v node &> /dev/null; then
  echo "📦 Cài Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 2. Cài PM2 nếu chưa có
if ! command -v pm2 &> /dev/null; then
  echo "📦 Cài PM2..."
  sudo npm install -g pm2
fi

# 3. Cài dependencies
echo "📦 Cài packages..."
npm install

# 4. Tạo file .env (PHẢI điền trước khi chạy)
if [ ! -f .env ]; then
  echo "⚠️  Chưa có file .env! Tạo từ mẫu..."
  cp .env.example .env
  echo "❗ Hãy mở .env và điền GEMINI_API_KEY trước khi tiếp tục!"
  exit 1
fi

# 5. Sync database
echo "🗄️  Sync database..."
npx prisma db push
npx prisma generate

# 6. Build production
echo "🔨 Build..."
npm run build

# 7. Khởi động với PM2
echo "🟢 Khởi động app..."
pm2 stop kaido-solar 2>/dev/null || true
pm2 start npm --name "kaido-solar" -- start
pm2 save
pm2 startup

echo ""
echo "✅ Deploy xong! App đang chạy tại port 3000"
echo "📊 Xem logs: pm2 logs kaido-solar"
echo "🔄 Restart: pm2 restart kaido-solar"
