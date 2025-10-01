/**
 * Тестовый скрипт для проверки Tilda webhook
 * Запуск: node test-tilda-webhook.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Тестовые данные для webhook'а
const testWebhooks = [
  {
    name: 'Покупка на 1500 рублей (0 прокруток)',
    data: {
      email: 'test1@example.com',
      amount: 1500,
      order_id: 'order_1500_001'
    }
  },
  {
    name: 'Покупка на 3000 рублей (1 прокрутка)',
    data: {
      email: 'test2@example.com',
      amount: 3000,
      order_id: 'order_3000_001'
    }
  },
  {
    name: 'Покупка на 9000 рублей (3 прокрутки)',
    data: {
      email: 'test3@example.com',
      amount: 9000,
      order_id: 'order_9000_001'
    }
  },
  {
    name: 'Покупка на 10000 рублей (3 прокрутки)',
    data: {
      email: 'test4@example.com',
      amount: 10000,
      order_id: 'order_10000_001'
    }
  },
  {
    name: 'Повторная покупка существующего пользователя',
    data: {
      email: 'test2@example.com',
      amount: 6000,
      order_id: 'order_6000_001'
    }
  }
];

async function testWebhook(webhookData) {
  try {
    console.log(`\n🧪 Тестируем: ${webhookData.name}`);
    console.log(`📊 Данные:`, webhookData.data);
    
    const response = await axios.post(`${BASE_URL}/api/tilda/webhook`, webhookData.data, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Tilda-Webhook-Test'
      }
    });
    
    console.log(`✅ Успешно! Ответ:`, response.data);
    
    // Проверяем количество прокруток
    const expectedSpins = Math.floor(webhookData.data.amount / 3000);
    if (response.data.spinsEarned === expectedSpins) {
      console.log(`🎯 Количество прокруток корректно: ${response.data.spinsEarned}`);
    } else {
      console.log(`❌ Ошибка в расчете прокруток! Ожидалось: ${expectedSpins}, получено: ${response.data.spinsEarned}`);
    }
    
  } catch (error) {
    console.log(`❌ Ошибка:`, error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Запуск тестов Tilda webhook...');
  console.log(`🌐 Базовый URL: ${BASE_URL}`);
  
  // Проверяем доступность сервера
  try {
    await axios.get(`${BASE_URL}/api/docs`);
    console.log('✅ Сервер доступен');
  } catch (error) {
    console.log('❌ Сервер недоступен. Убедитесь, что приложение запущено на порту 3000');
    return;
  }
  
  // Запускаем тесты
  for (const webhook of testWebhooks) {
    await testWebhook(webhook);
    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 Тестирование завершено!');
}

// Запускаем тесты
runTests().catch(console.error);