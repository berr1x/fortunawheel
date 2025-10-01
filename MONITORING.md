# 📊 Мониторинг и обслуживание Fortuna

## 🔍 Мониторинг приложения

### PM2 команды

```bash
# Статус всех процессов
pm2 status

# Детальная информация о процессе
pm2 show fortuna

# Логи в реальном времени
pm2 logs fortuna

# Логи с фильтрацией
pm2 logs fortuna --lines 100

# Мониторинг ресурсов
pm2 monit

# Перезапуск приложения
pm2 restart fortuna

# Остановка приложения
pm2 stop fortuna

# Удаление из PM2
pm2 delete fortuna
```

### Systemd команды

```bash
# Статус сервиса
sudo systemctl status fortuna

# Запуск сервиса
sudo systemctl start fortuna

# Остановка сервиса
sudo systemctl stop fortuna

# Перезапуск сервиса
sudo systemctl restart fortuna

# Включение автозапуска
sudo systemctl enable fortuna

# Логи сервиса
sudo journalctl -u fortuna -f
```

## 📈 Мониторинг производительности

### Проверка ресурсов

```bash
# Использование CPU и памяти
htop

# Использование диска
df -h

# Использование памяти
free -h

# Сетевые соединения
netstat -tulpn

# Процессы Node.js
ps aux | grep node
```

### Мониторинг базы данных

```bash
# Подключение к PostgreSQL
sudo -u postgres psql fortuna_db

# Размер базы данных
SELECT pg_size_pretty(pg_database_size('fortuna_db'));

# Активные соединения
SELECT count(*) FROM pg_stat_activity WHERE datname = 'fortuna_db';

# Медленные запросы
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Мониторинг Redis

```bash
# Подключение к Redis
redis-cli

# Информация о Redis
INFO

# Использование памяти
INFO memory

# Количество ключей
DBSIZE

# Мониторинг команд в реальном времени
MONITOR
```

## 🔧 Обслуживание

### Резервное копирование

```bash
#!/bin/bash
# backup.sh - Скрипт резервного копирования

BACKUP_DIR="/opt/backups/fortuna"
DATE=$(date +%Y%m%d_%H%M%S)

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump fortuna_db > $BACKUP_DIR/database_$DATE.sql

# Бэкап загруженных файлов
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/fortuna/uploads

# Бэкап конфигурации
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /opt/fortuna/.env /opt/fortuna/ecosystem.config.js

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Резервное копирование завершено: $DATE"
```

### Очистка логов

```bash
#!/bin/bash
# cleanup-logs.sh - Очистка старых логов

LOG_DIR="/opt/fortuna/logs"
DAYS_TO_KEEP=30

# Очистка логов PM2
find $LOG_DIR -name "*.log" -mtime +$DAYS_TO_KEEP -delete

# Очистка логов Nginx
sudo find /var/log/nginx -name "*.log" -mtime +$DAYS_TO_KEEP -delete

# Ротация логов
sudo logrotate -f /etc/logrotate.d/nginx

echo "✅ Очистка логов завершена"
```

### Обновление приложения

```bash
#!/bin/bash
# update.sh - Обновление приложения

APP_DIR="/opt/fortuna"
BACKUP_DIR="/opt/backups/fortuna"

echo "🔄 Начинаем обновление приложения..."

# Создание бэкапа
./backup.sh

# Остановка приложения
pm2 stop fortuna

# Переход в директорию приложения
cd $APP_DIR

# Получение обновлений
git pull origin main

# Установка зависимостей
npm ci --only=production

# Применение миграций
npx prisma migrate deploy

# Генерация Prisma клиента
npx prisma generate

# Сборка приложения
npm run build

# Запуск приложения
pm2 start fortuna

echo "✅ Обновление завершено"
```

## 🚨 Алерты и уведомления

### Настройка мониторинга

```bash
# Установка htop для мониторинга
sudo apt install htop

# Установка iotop для мониторинга диска
sudo apt install iotop

# Установка nethogs для мониторинга сети
sudo apt install nethogs
```

### Скрипт проверки здоровья

```bash
#!/bin/bash
# health-check.sh - Проверка здоровья приложения

APP_URL="http://localhost:3000"
LOG_FILE="/opt/fortuna/logs/health-check.log"

# Проверка доступности API
if curl -f -s $APP_URL/api/docs > /dev/null; then
    echo "$(date): ✅ API доступен" >> $LOG_FILE
else
    echo "$(date): ❌ API недоступен" >> $LOG_FILE
    # Отправка уведомления
    # curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
    #      -H "Content-Type: application/json" \
    #      -d '{"text":"🚨 Fortuna API недоступен!"}'
fi

# Проверка использования памяти
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    echo "$(date): ⚠️ Высокое использование памяти: ${MEMORY_USAGE}%" >> $LOG_FILE
fi

# Проверка использования диска
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "$(date): ⚠️ Высокое использование диска: ${DISK_USAGE}%" >> $LOG_FILE
fi
```

### Настройка cron задач

```bash
# Редактирование crontab
crontab -e

# Добавление задач:
# Проверка здоровья каждые 5 минут
*/5 * * * * /opt/fortuna/health-check.sh

# Резервное копирование каждый день в 2:00
0 2 * * * /opt/fortuna/backup.sh

# Очистка логов каждую неделю
0 3 * * 0 /opt/fortuna/cleanup-logs.sh

# Обновление системы каждую неделю
0 4 * * 0 apt update && apt upgrade -y
```

## 📊 Метрики для мониторинга

### Ключевые метрики

1. **Доступность API** - время отклика < 500ms
2. **Использование памяти** - < 80%
3. **Использование CPU** - < 70%
4. **Использование диска** - < 85%
5. **Количество активных соединений** - < 1000
6. **Время отклика базы данных** - < 100ms

### Логи для анализа

- **Ошибки приложения** - `/opt/fortuna/logs/err.log`
- **Общие логи** - `/opt/fortuna/logs/out.log`
- **Логи Nginx** - `/var/log/nginx/access.log`
- **Логи PostgreSQL** - `/var/log/postgresql/postgresql-*.log`
- **Логи Redis** - `/var/log/redis/redis-server.log`

## 🔧 Устранение неполадок

### Частые проблемы

1. **Приложение не запускается**
   ```bash
   pm2 logs fortuna
   sudo journalctl -u fortuna
   ```

2. **Высокое использование памяти**
   ```bash
   pm2 restart fortuna
   # или
   pm2 reload fortuna
   ```

3. **Проблемы с базой данных**
   ```bash
   sudo systemctl status postgresql
   sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
   ```

4. **Проблемы с Redis**
   ```bash
   sudo systemctl status redis
   redis-cli ping
   ```

### Полезные команды

```bash
# Просмотр всех портов
sudo netstat -tulpn

# Проверка процессов Node.js
ps aux | grep node

# Проверка использования файлов
lsof | grep node

# Проверка сетевых соединений
ss -tulpn

# Проверка системных ресурсов
vmstat 1 5
```