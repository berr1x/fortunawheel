#!/bin/bash

# Скрипт для запуска Fortuna в Docker
# Использование: ./docker-start.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "🐳 Запуск Fortuna в Docker (режим: $ENVIRONMENT)"

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "📋 Создание .env файла из примера..."
    cp docker.env .env
    echo "⚠️  Отредактируйте файл .env перед запуском!"
    echo "   Особенно важны: SENDSAY_API_KEY, SENDSAY_LOGIN, SENDSAY_PASSWORD, JWT_SECRET"
    read -p "Нажмите Enter после редактирования .env файла..."
fi

# Создание необходимых папок
echo "📁 Создание необходимых папок..."
mkdir -p uploads logs

# Остановка существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
docker-compose down

# Сборка и запуск
echo "🔨 Сборка и запуск контейнеров..."
docker-compose up --build -d

# Ожидание запуска базы данных
echo "⏳ Ожидание запуска базы данных..."
sleep 10

# Применение миграций
echo "🗄️ Применение миграций базы данных..."
docker-compose exec app npx prisma migrate deploy

# Генерация Prisma клиента
echo "⚙️ Генерация Prisma клиента..."
docker-compose exec app npx prisma generate

# Проверка статуса
echo "📊 Проверка статуса контейнеров..."
docker-compose ps

echo "✅ Fortuna запущена!"
echo "🌐 Приложение доступно по адресу: http://localhost:3000"
echo "📚 API документация: http://localhost:3000/api/docs"
echo "📝 Логи: docker-compose logs -f app"
echo "🛑 Остановка: docker-compose down"