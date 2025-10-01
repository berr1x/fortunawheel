/**
 * Тестовый скрипт для проверки логики сессий
 * Запуск: node test-session-logic.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Тестовые сценарии
const testCases = [
  {
    name: 'Несуществующий пользователь',
    email: 'nonexistent@example.com',
    expectedSuccess: false,
    expectedMessage: 'Пользователь не найден. Сначала совершите покупку через Tilda.'
  },
  {
    name: 'Пользователь без покупок (если такой есть)',
    email: 'nopurchases@example.com',
    expectedSuccess: false,
    expectedMessage: 'У вас нет доступных прокруток. Совершите покупку через Tilda.'
  },
  {
    name: 'Некорректный email',
    email: 'invalid-email',
    expectedSuccess: false,
    expectedError: 'BadRequestException'
  }
];

async function testSession(email, testCase) {
  try {
    console.log(`\n🧪 Тестируем: ${testCase.name}`);
    console.log(`📧 Email: ${email}`);
    
    const response = await axios.get(`${BASE_URL}/api/wheel/session`, {
      params: { email },
      validateStatus: () => true // Не выбрасывать ошибки для HTTP статусов
    });
    
    console.log(`📊 Статус: ${response.status}`);
    console.log(`📋 Ответ:`, response.data);
    
    // Проверяем ожидаемый результат
    if (testCase.expectedError) {
      if (response.status === 400) {
        console.log(`✅ Ошибка валидации корректна`);
      } else {
        console.log(`❌ Ожидалась ошибка валидации, получен статус ${response.status}`);
      }
    } else if (testCase.expectedSuccess === false) {
      if (response.data.success === false && response.data.message === testCase.expectedMessage) {
        console.log(`✅ Сообщение об ошибке корректно`);
      } else {
        console.log(`❌ Неожиданный ответ. Ожидалось: ${testCase.expectedMessage}`);
      }
    } else {
      if (response.data.success === true) {
        console.log(`✅ Сессия создана успешно`);
        console.log(`🎯 Прокруток: ${response.data.spinsRemaining}`);
      } else {
        console.log(`❌ Сессия не была создана`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Ошибка запроса:`, error.message);
  }
}

async function testWithPurchase() {
  console.log(`\n🛒 Сначала создаем покупку через Tilda webhook...`);
  
  try {
    // Создаем покупку на 6000 рублей (2 прокрутки)
    const purchaseResponse = await axios.post(`${BASE_URL}/api/tilda/webhook`, {
      email: 'testuser@example.com',
      amount: 6000,
      order_id: 'test_order_001'
    });
    
    console.log(`✅ Покупка создана:`, purchaseResponse.data);
    
    // Теперь тестируем получение сессии
    console.log(`\n🎯 Тестируем получение сессии для пользователя с покупкой...`);
    await testSession('testuser@example.com', {
      name: 'Пользователь с покупкой',
      expectedSuccess: true
    });
    
  } catch (error) {
    console.log(`❌ Ошибка при создании покупки:`, error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Запуск тестов логики сессий...');
  console.log(`🌐 Базовый URL: ${BASE_URL}`);
  
  // Проверяем доступность сервера
  try {
    await axios.get(`${BASE_URL}/api/docs`);
    console.log('✅ Сервер доступен');
  } catch (error) {
    console.log('❌ Сервер недоступен. Убедитесь, что приложение запущено на порту 3000');
    return;
  }
  
  // Тестируем сценарии без покупок
  for (const testCase of testCases) {
    await testSession(testCase.email, testCase);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Тестируем сценарий с покупкой
  await testWithPurchase();
  
  console.log('\n🏁 Тестирование завершено!');
}

// Запускаем тесты
runTests().catch(console.error);