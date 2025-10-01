План разработки по этапам

Этап 0: Каркас.

NestJS + Prisma/TypeORM + PostgreSQL + Redis.

Настроить подключения, миграции БД.

Этап 1: Админка и управление данными.

Развернуть AdminJS.

Настроить модели для ручного управления prizes, users, purchases.

Это даст вам инструмент для наполнения и отладки еще до создания основного API.

Этап 2: Интеграция с Tilda.

Создать API endpoint, который будет принимать webhook от Tilda о новой покупке.

Логика: создать/найти пользователя по почте, записать покупку, создать сессию прокруток (spin_sessions).

Этап 3: Логика колеса.

Endpoint для входа по почте (GET /api/wheel/session).

Endpoint для прокрутки (POST /api/wheel/spin). Здесь самая сложная логика с рандомом, проверкой лимитов, резервированием призов.

Обязательно используйте транзакции БД в этом методе!

Этап 4: Интеграция с Sendsay и очередь писем.

Настроить Bull Queue.

После успешной прокрутки добавлять задачу в очередь на отправку с задержкой delay: 5 * 60 * 1000 (5 минут).

Worker обрабатывает очередь и отправляет письмо через Sendsay API.

Этап 5: Нагрузочное тестирование.

Протестируйте endpoint прокрутки на 3k одновременных запросов с помощью k6 или artillery. Убедитесь, что БД и Redis выдерживают нагрузку.

Стек: NestJS + PostgreSQL + Redis + Prisma + AdminJS + Bull Queue + Sendsay API.


Таблицы для PostgreSQL
-- Пользователи (по почте)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Покупки (интеграция с Тильдой)
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    order_id VARCHAR(255) UNIQUE, -- ID из Тильды/CRM
    amount INTEGER NOT NULL, -- Сумма чека
    spins_earned INTEGER NOT NULL, -- Рассчитанное кол-во прокруток (amount / 3000)
    customer_email VARCHAR(255), -- Почта, указанная при оплате (на случай, если user_id еще не создан)
    data JSONB, -- Весь сырой ответ от Тильды на случай проблем
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Подарки
CREATE TABLE prizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_quantity INTEGER NOT NULL, -- Общее количество (например, 500 для книги)
    quantity_remaining INTEGER NOT NULL, -- Оставшееся количество
    type VARCHAR(50) -- 'many', 'limited', 'rare' для упрощения логики
);

-- Сессии прокрутки (связь покупки и пользователя)
CREATE TABLE spin_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    purchase_id INTEGER REFERENCES purchases(id),
    spins_total INTEGER NOT NULL, -- Всего прокруток по этой покупке
    spins_used INTEGER DEFAULT 0 NOT NULL, -- Использовано прокруток
    is_active BOOLEAN DEFAULT TRUE, -- False, если все прокрутки использованы
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Результаты прокруток (самая важная таблица)
CREATE TABLE spin_results (
    id SERIAL PRIMARY KEY,
    spin_session_id INTEGER REFERENCES spin_sessions(id),
    prize_id INTEGER REFERENCES prizes(id),
    -- user_id и purchase_id можно продублировать сюда для упрощения запросов
    user_id INTEGER REFERENCES users(id),
    purchase_id INTEGER REFERENCES purchases(id),
    -- Статус: 'issued', 'pending' (если нужна модерация), 'canceled'
    status VARCHAR(50) DEFAULT 'issued',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Очередь писем (для задержки)
CREATE TABLE email_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    spin_result_id INTEGER REFERENCES spin_results(id),
    subject TEXT,
    body TEXT,
    send_after TIMESTAMPTZ NOT NULL, -- Время, после которого можно отправить
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ
);

DB_USER=postgres
DB_HOST=localhost
DB_NAME=FCards
DB_PASSWORD=a223344a
DB_PORT=5432