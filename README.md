# 🎰 Fortuna - Система колеса фортуны

Современная система колеса фортуны с интеграцией Tilda и Sendsay для автоматической обработки покупок и отправки уведомлений о выигрышах.

## 🚀 Возможности

- **Интеграция с Tilda** - автоматическая обработка покупок через webhook
- **Колесо фортуны** - система прокруток с умным алгоритмом выбора призов
- **Обязательные призы** - гарантированная выдача определенных призов за период
- **Email уведомления** - автоматическая отправка через Sendsay
- **Управление призами** - полный CRUD с изображениями
- **Статистика** - отслеживание выигранных призов пользователей

## 🏗️ Технологии

- **Backend:** NestJS + TypeScript
- **База данных:** PostgreSQL + Prisma ORM
- **Кэш:** Redis
- **Email:** Sendsay API
- **Документация:** Swagger/OpenAPI
- **Контейнеризация:** Docker (опционально)

## 📋 Требования

- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- npm или yarn

## 🛠️ Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/fortuna.git
cd fortuna
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Скопируйте пример конфигурации
cp env.example .env

# Отредактируйте файл
nano .env
```

**Обязательные переменные:**
```env
# База данных
DATABASE_URL="postgresql://username:password@localhost:5432/fortuna_db"

# Redis
REDIS_URL="redis://localhost:6379"

# Sendsay (Email сервис)
SENDSAY_API_KEY="your_sendsay_api_key"
SENDSAY_LOGIN="your_sendsay_login"
SENDSAY_PASSWORD="your_sendsay_password"

# API конфигурация
BACKEND_URL="http://localhost:3000"
PORT=3000

# JWT секрет (сгенерируйте безопасный ключ)
JWT_SECRET="your_super_secure_jwt_secret_key"

# Окружение
NODE_ENV="development"
```

### 4. Настройка базы данных

```bash
# Применение миграций
npx prisma migrate dev

# Генерация Prisma клиента
npx prisma generate

# (Опционально) Заполнение тестовыми данными
npx prisma db seed
```

### 5. Запуск приложения

```bash
# Режим разработки
npm run start:dev

# Продакшн режим
npm run build
npm run start:prod
```

## 🐳 Docker установка

### Быстрый запуск

```bash
# 1. Клонирование и настройка
git clone https://github.com/your-username/fortuna.git
cd fortuna

# 2. Настройка переменных окружения
cp docker.env .env
nano .env  # Отредактируйте настройки

# 3. Запуск через скрипт
chmod +x docker-start.sh
./docker-start.sh

# Или ручной запуск
docker-compose up -d
```

### Ручная настройка

1. **Настройка переменных окружения:**
   ```bash
   cp docker.env .env
   # Отредактируйте .env файл с вашими настройками
   ```

2. **Запуск контейнеров:**
   ```bash
   # Сборка и запуск
   docker-compose up --build -d
   
   # Применение миграций
   docker-compose exec app npx prisma migrate deploy
   
   # Генерация Prisma клиента
   docker-compose exec app npx prisma generate
   ```

### Управление Docker контейнерами

```bash
# Просмотр статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f app

# Остановка
docker-compose down

# Перезапуск
docker-compose restart app

# Обновление
docker-compose pull
docker-compose up --build -d
```

## 🚀 Развертывание на сервере

### 1. Подготовка сервера (Ubuntu/Debian)

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Установка Redis
sudo apt install redis-server -y

# Установка PM2 для управления процессами
sudo npm install -g pm2

# Установка Nginx (опционально)
sudo apt install nginx -y
```

### 2. Настройка PostgreSQL

```bash
# Переход к пользователю postgres
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE fortuna_db;
CREATE USER fortuna_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE fortuna_db TO fortuna_user;
\q
```

### 3. Настройка Redis

```bash
# Редактирование конфигурации Redis
sudo nano /etc/redis/redis.conf

# Убедитесь что:
# bind 127.0.0.1
# port 6379
# requirepass your_redis_password (опционально)

# Перезапуск Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 4. Развертывание приложения

```bash
# Клонирование репозитория
git clone https://github.com/your-username/fortuna.git
cd fortuna

# Установка зависимостей
npm install

# Создание .env файла
cp .env.example .env
nano .env  # Отредактируйте настройки

# Применение миграций
npx prisma migrate deploy

# Генерация Prisma клиента
npx prisma generate

# Сборка приложения
npm run build

# Создание папки для загрузок
mkdir uploads
chmod 755 uploads
```

### 5. Настройка PM2

```bash
# Создание ecosystem файла
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'fortuna',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Создание папки для логов
mkdir logs

# Запуск приложения
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save
pm2 startup
```

### 6. Настройка Nginx (опционально)

```bash
# Создание конфигурации Nginx
sudo nano /etc/nginx/sites-available/fortuna

# Содержимое файла:
server {
    listen 80;
    server_name your-domain.com;

    # API запросы
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы (изображения призов)
    location /uploads {
        alias /path/to/fortuna/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Swagger документация
    location /api/docs {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Активация сайта
sudo ln -s /etc/nginx/sites-available/fortuna /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📚 API Документация

После запуска приложения документация доступна по адресу:
- **Swagger UI:** `http://localhost:3000/api/docs`
- **JSON Schema:** `http://localhost:3000/api/docs-json`

### Основные эндпоинты:

- `POST /api/tilda/webhook` - Webhook от Tilda для обработки покупок
- `GET /api/wheel/session` - Получение сессии прокруток
- `POST /api/wheel/spin` - Прокрутка колеса
- `GET /api/wheel/prizes` - Список доступных призов
- `GET /api/wheel/won-prizes` - Выигранные призы пользователя
- `GET /api/mandatory-prizes/active` - Активные обязательные призы

## 🧪 Тестирование

```bash
# Запуск тестов
npm run test

# Тестирование Tilda интеграции
node test-tilda-webhook.js

# Тестирование логики сессий
node test-session-logic.js

# Тестирование исправления багов
node test-infinite-spins-bug.js

# Тестирование выигранных призов
node test-won-prizes.js
```

## 📁 Структура проекта

```
fortuna/
├── src/
│   ├── modules/           # Модули приложения
│   │   ├── wheel/        # Колесо фортуны
│   │   └── tilda/        # Tilda интеграция
│   ├── services/         # Бизнес-логика
│   ├── config/           # Конфигурация
│   └── main.ts          # Точка входа
├── prisma/              # Схема базы данных
├── uploads/             # Статические файлы
├── test-*.js           # Тестовые скрипты
└── docs/               # Документация
```

## 🔧 Разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run start:dev

# Сборка
npm run build

# Линтинг
npm run lint

# Форматирование кода
npm run format
```

## 📊 Мониторинг

```bash
# Статус PM2 процессов
pm2 status

# Логи приложения
pm2 logs fortuna

# Мониторинг ресурсов
pm2 monit

# Перезапуск приложения
pm2 restart fortuna
```

## 🔒 Безопасность

- Все API эндпоинты защищены валидацией
- Webhook'и от Tilda должны быть проверены на подлинность
- Используйте HTTPS в продакшене
- Регулярно обновляйте зависимости
- Настройте файрвол для ограничения доступа к БД

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 📞 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [Issues](https://github.com/your-username/fortuna/issues)
2. Создайте новый Issue с подробным описанием
3. Свяжитесь с командой разработки

---

**Удачного использования! 🎰✨**