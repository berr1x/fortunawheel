# API получения выигранных призов

## Эндпоинт

**URL:** `GET /api/wheel/won-prizes`

**Описание:** Получение всех выигранных призов пользователя

## Параметры запроса

| Параметр | Тип | Обязательный | Описание | Пример |
|----------|-----|--------------|----------|---------|
| email | string | Да | Email пользователя | user@example.com |

## Примеры запросов

### Успешный запрос
```bash
GET /api/wheel/won-prizes?email=user@example.com
```

### Ответ при успехе
```json
{
  "success": true,
  "prizes": [
    {
      "id": 123,
      "prize": {
        "id": 1,
        "name": "iPhone 15",
        "type": "rare",
        "image": "http://localhost:3000/uploads/iphone15.jpg"
      },
      "session": {
        "id": 456,
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      "purchase": {
        "id": 789,
        "orderId": "order_12345",
        "amount": 9000,
        "createdAt": "2024-01-15T10:25:00.000Z"
      },
      "status": "issued",
      "wonAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "totalCount": 1
}
```

### Ответ при отсутствии призов
```json
{
  "success": true,
  "prizes": [],
  "totalCount": 0
}
```

### Ответ для несуществующего пользователя
```json
{
  "success": false,
  "message": "Пользователь не найден",
  "prizes": [],
  "totalCount": 0
}
```

### Ошибка валидации
```json
{
  "statusCode": 400,
  "message": "Некорректный email адрес",
  "error": "Bad Request"
}
```

## Структура данных

### Объект приза
```typescript
{
  id: number;                    // ID результата прокрутки
  prize: {
    id: number;                  // ID приза
    name: string;                // Название приза
    type: string | null;         // Тип приза (rare, limited, many)
    image: string | null;        // URL изображения приза
  };
  session: {
    id: number;                  // ID сессии прокруток
    createdAt: Date;             // Дата создания сессии
  };
  purchase: {
    id: number;                  // ID покупки
    orderId: string;             // ID заказа в Tilda
    amount: number;              // Сумма покупки
    createdAt: Date;             // Дата покупки
  };
  status: string;                // Статус приза (issued, pending, etc.)
  wonAt: Date;                   // Дата выигрыша
}
```

## Особенности

1. **Сортировка:** Призы отсортированы по дате выигрыша (новые сначала)
2. **Изображения:** Автоматически формируются полные URL для изображений
3. **Статусы:** Включает информацию о статусе выдачи приза
4. **Контекст:** Показывает связь с покупкой и сессией прокруток

## Коды ошибок

- **400 Bad Request** - некорректный email
- **404 Not Found** - пользователь не найден
- **500 Internal Server Error** - ошибка сервера

## Тестирование

Запустите тестовый скрипт:
```bash
node test-won-prizes.js
```

Скрипт проверит:
- Получение призов для существующего пользователя
- Обработку несуществующего пользователя
- Валидацию email адреса
- Корректность структуры ответа