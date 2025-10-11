# API Админки Fortuna

Данный документ описывает API для админки системы колеса фортуны.

## Базовый URL
```
http://localhost:3000/api/admin
```

## Управление пользователями

### Получить список пользователей
```http
GET /admin/users?search=email@example.com
```

**Параметры запроса:**
- `search` (опционально) - поиск по email

**Ответ:**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z",
    "totalPurchaseAmount": 5000,
    "totalSpinsEarned": 25,
    "totalSpinsUsed": 10,
    "spinsRemaining": 15,
    "wonPrizes": [
      {
        "name": "Приз 1",
        "type": "rare",
        "count": 2
      }
    ],
    "purchasesCount": 2,
    "sessionsCount": 2
  }
]
```

### Создать нового пользователя
```http
POST /admin/users
```

**Тело запроса:**
```json
{
  "email": "newuser@example.com",
  "purchaseAmount": 1000,
  "spinsCount": 5
}
```

**Ответ:**
```json
{
  "id": 2,
  "email": "newuser@example.com",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Обновить пользователя
```http
PUT /admin/users/{id}
```

**Тело запроса:**
```json
{
  "email": "updated@example.com",
  "purchaseAmount": 2000,
  "spinsCount": 10
}
```

**Ответ:**
```json
{
  "message": "Пользователь успешно обновлен"
}
```

## Управление призами

### Получить список призов
```http
GET /admin/prizes
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "Приз 1",
    "total_quantity": 100,
    "quantity_remaining": 95,
    "type": "rare",
    "image": "prize1.png",
    "from_color": "#ff0000",
    "to_color": "#00ff00",
    "between_color": "#ffff00",
    "text_color": "#ffffff",
    "number": 1
  }
]
```

### Создать новый приз
```http
POST /admin/prizes
```

**Тело запроса:**
```json
{
  "name": "Новый приз",
  "total_quantity": 50,
  "quantity_remaining": 50,
  "type": "many",
  "image": "newprize.png",
  "from_color": "#ff0000",
  "to_color": "#00ff00",
  "between_color": "#ffff00",
  "text_color": "#ffffff",
  "number": 5
}
```

### Обновить приз
```http
PUT /admin/prizes/{id}
```

**Тело запроса:**
```json
{
  "name": "Обновленный приз",
  "total_quantity": 75,
  "quantity_remaining": 60,
  "type": "limited"
}
```

### Удалить приз
```http
DELETE /admin/prizes/{id}
```

**Ответ:**
```json
{
  "message": "Приз успешно удален"
}
```

### Обновить количество выпадений приза
```http
PUT /admin/prizes/{id}/quantity
```

**Тело запроса:**
```json
{
  "quantity": 80
}
```

## Управление обязательными призами

### Получить список обязательных призов
```http
GET /admin/mandatory-prizes
```

**Ответ:**
```json
[
  {
    "id": 1,
    "prize_id": 1,
    "target_quantity": 10,
    "issued_quantity": 5,
    "period_start": "2024-01-01T00:00:00.000Z",
    "period_end": "2024-01-02T00:00:00.000Z",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "prize": {
      "id": 1,
      "name": "Приз 1",
      "type": "rare",
      "image": "prize1.png"
    }
  }
]
```

### Создать новый обязательный приз
```http
POST /admin/mandatory-prizes
```

**Тело запроса:**
```json
{
  "prize_id": 1,
  "target_quantity": 15,
  "period_start": "2024-01-01T00:00:00.000Z",
  "period_end": "2024-01-02T00:00:00.000Z"
}
```

### Обновить обязательный приз
```http
PUT /admin/mandatory-prizes/{id}
```

**Тело запроса:**
```json
{
  "target_quantity": 20,
  "is_active": false
}
```

### Удалить обязательный приз
```http
DELETE /admin/mandatory-prizes/{id}
```

**Ответ:**
```json
{
  "message": "Обязательный приз успешно удален"
}
```

## Типы призов

- `many` - обычные призы (высокая вероятность выпадения)
- `rare` - редкие призы (средняя вероятность выпадения)
- `limited` - ограниченные призы (низкая вероятность выпадения)

## Коды ошибок

- `400` - Неверные данные запроса
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

## Примеры использования

### Поиск пользователя по email
```bash
curl "http://localhost:3000/api/admin/users?search=user@example.com"
```

### Создание пользователя с покупкой
```bash
curl -X POST "http://localhost:3000/api/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "purchaseAmount": 1500,
    "spinsCount": 7
  }'
```

### Обновление количества приза
```bash
curl -X PUT "http://localhost:3000/api/admin/prizes/1/quantity" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 90}'
```
