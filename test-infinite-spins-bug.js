/**
 * Тестовый скрипт для проверки исправления бага бесконечных прокруток
 * Запуск: node test-infinite-spins-bug.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testInfiniteSpinsBug() {
  console.log('🐛 Тестирование исправления бага бесконечных прокруток...\n');
  
  try {
    // 1. Создаем покупку через Tilda webhook
    console.log('1️⃣ Создаем покупку на 3000 рублей (1 прокрутка)...');
    const purchaseResponse = await axios.post(`${BASE_URL}/api/tilda/webhook`, {
      email: 'bugtest@example.com',
      amount: 3000,
      order_id: 'bug_test_order_001'
    });
    
    console.log('✅ Покупка создана:', purchaseResponse.data);
    
    // 2. Получаем сессию
    console.log('\n2️⃣ Получаем сессию...');
    const sessionResponse1 = await axios.get(`${BASE_URL}/api/wheel/session`, {
      params: { email: 'bugtest@example.com' }
    });
    
    console.log('✅ Сессия получена:', sessionResponse1.data);
    const sessionId = sessionResponse1.data.sessionId;
    
    // 3. Используем все прокрутки
    console.log('\n3️⃣ Используем все прокрутки...');
    const spinResponse = await axios.post(`${BASE_URL}/api/wheel/spin`, {
      sessionId: sessionId
    });
    
    console.log('✅ Прокрутка выполнена:', spinResponse.data);
    
    // 4. Пытаемся прокрутить еще раз (должно быть ошибка)
    console.log('\n4️⃣ Пытаемся прокрутить еще раз (должно быть ошибка)...');
    try {
      const spinResponse2 = await axios.post(`${BASE_URL}/api/wheel/spin`, {
        sessionId: sessionId
      });
      console.log('❌ БАГ! Прокрутка прошла успешно:', spinResponse2.data);
    } catch (error) {
      console.log('✅ Ошибка корректна:', error.response?.data?.message || error.message);
    }
    
    // 5. Пытаемся получить новую сессию (должно быть ошибка)
    console.log('\n5️⃣ Пытаемся получить новую сессию (должно быть ошибка)...');
    try {
      const sessionResponse2 = await axios.get(`${BASE_URL}/api/wheel/session`, {
        params: { email: 'bugtest@example.com' }
      });
      
      if (sessionResponse2.data.success === false) {
        console.log('✅ Ошибка корректна:', sessionResponse2.data.message);
      } else {
        console.log('❌ БАГ! Новая сессия создана:', sessionResponse2.data);
      }
    } catch (error) {
      console.log('✅ Ошибка корректна:', error.response?.data?.message || error.message);
    }
    
    // 6. Создаем вторую покупку и проверяем, что новая сессия создается
    console.log('\n6️⃣ Создаем вторую покупку на 6000 рублей (2 прокрутки)...');
    const purchaseResponse2 = await axios.post(`${BASE_URL}/api/tilda/webhook`, {
      email: 'bugtest@example.com',
      amount: 6000,
      order_id: 'bug_test_order_002'
    });
    
    console.log('✅ Вторая покупка создана:', purchaseResponse2.data);
    
    // 7. Получаем новую сессию для второй покупки
    console.log('\n7️⃣ Получаем новую сессию для второй покупки...');
    const sessionResponse3 = await axios.get(`${BASE_URL}/api/wheel/session`, {
      params: { email: 'bugtest@example.com' }
    });
    
    if (sessionResponse3.data.success === true) {
      console.log('✅ Новая сессия создана корректно:', sessionResponse3.data);
    } else {
      console.log('❌ Ошибка при создании новой сессии:', sessionResponse3.data);
    }
    
    console.log('\n🏁 Тестирование завершено!');
    
  } catch (error) {
    console.log('❌ Ошибка тестирования:', error.response?.data || error.message);
  }
}

async function runTest() {
  console.log('🚀 Запуск теста исправления бага...');
  console.log(`🌐 Базовый URL: ${BASE_URL}\n`);
  
  // Проверяем доступность сервера
  try {
    await axios.get(`${BASE_URL}/api/docs`);
    console.log('✅ Сервер доступен\n');
  } catch (error) {
    console.log('❌ Сервер недоступен. Убедитесь, что приложение запущено на порту 3000');
    return;
  }
  
  await testInfiniteSpinsBug();
}

// Запускаем тест
runTest().catch(console.error);