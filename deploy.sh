#!/bin/bash

# Скрипт для развертывания Fortuna на сервере
# Использование: ./deploy.sh [production|development]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="fortuna"
APP_DIR="/opt/fortuna"
SERVICE_USER="fortuna"

echo "🚀 Развертывание Fortuna в режиме: $ENVIRONMENT"

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Запустите скрипт с правами root: sudo ./deploy.sh"
    exit 1
fi

# Создание пользователя для приложения
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "👤 Создание пользователя $SERVICE_USER..."
    useradd -r -s /bin/false -d $APP_DIR $SERVICE_USER
fi

# Создание директории приложения
echo "📁 Создание директории приложения..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/uploads

# Копирование файлов (предполагается, что код уже в $APP_DIR)
echo "📋 Копирование файлов..."
cp -r . $APP_DIR/
cd $APP_DIR

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm ci --only=production

# Настройка переменных окружения
if [ ! -f .env ]; then
    echo "⚙️ Создание .env файла..."
    cp env.example .env
    echo "⚠️  Отредактируйте файл .env перед запуском!"
fi

# Генерация Prisma клиента
echo "🗄️ Генерация Prisma клиента..."
npx prisma generate

# Применение миграций
echo "🔄 Применение миграций базы данных..."
npx prisma migrate deploy

# Сборка приложения
echo "🔨 Сборка приложения..."
npm run build

# Настройка прав доступа
echo "🔐 Настройка прав доступа..."
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
chmod +x $APP_DIR/deploy.sh

# Установка PM2
echo "⚡ Установка PM2..."
npm install -g pm2

# Запуск приложения через PM2
echo "🚀 Запуск приложения..."
pm2 start ecosystem.config.js --env $ENVIRONMENT
pm2 save
pm2 startup

# Настройка Nginx (если установлен)
if command -v nginx &> /dev/null; then
    echo "🌐 Настройка Nginx..."
    cp nginx.conf /etc/nginx/sites-available/fortuna
    ln -sf /etc/nginx/sites-available/fortuna /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
fi

# Настройка файрвола
echo "🔥 Настройка файрвола..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Создание systemd сервиса для PM2
echo "🔧 Создание systemd сервиса..."
cat > /etc/systemd/system/fortuna.service << EOF
[Unit]
Description=Fortuna PM2 Service
After=network.target

[Service]
Type=forking
User=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env $ENVIRONMENT
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 stop all
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable fortuna

echo "✅ Развертывание завершено!"
echo "📊 Статус приложения: pm2 status"
echo "📝 Логи: pm2 logs $APP_NAME"
echo "🔄 Перезапуск: pm2 restart $APP_NAME"
echo "🌐 Приложение доступно по адресу: http://localhost:3000"
echo "📚 API документация: http://localhost:3000/api/docs"