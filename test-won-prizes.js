/**
 * Тестовый скрипт для проверки эндпоинта получения выигранных призов
 * Запуск: node test-won-prizes.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testWonPrizes() {
  console.log('🎁 Тестирование эндпоинта получения выигранных призов...\n');
  
  try {
    // 1. Создаем покупку и выигрываем призы
    console.log('1️⃣ Создаем покупку на 9000 рублей (3 прокрутки)...');
    const purchaseResponse = await axios.post(`${BASE_URL}/api/tilda/webhook`, {
      email: 'prizetest@example.com',
      amount: 9000,
      order_id: 'prize_test_order_001'
    });
    
    console.log('✅ Покупка создана:', purchaseResponse.data);
    
    // 2. Получаем сессию
    console.log('\n2️⃣ Получаем сессию...');
    const sessionResponse = await axios.get(`${BASE_URL}/api/wheel/session`, {
      params: { email: 'prizetest@example.com' }
    });
    
    console.log('✅ Сессия получена:', sessionResponse.data);
    const sessionId = sessionResponse.data.sessionId;
    
    // 3. Выполняем несколько прокруток
    console.log('\n3️⃣ Выполняем прокрутки...');
    const spinResults = [];
    
    for (let i = 0; i < 3; i++) {
      try {
        const spinResponse = await axios.post(`${BASE_URL}/api/wheel/spin`, {
          sessionId: sessionId
        });
        
        console.log(`✅ Прокрутка ${i + 1}:`, spinResponse.data);
        spinResults.push(spinResponse.data);
        
        // Небольшая пауза между прокрутками
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`❌ Ошибка прокрутки ${i + 1}:`, error.response?.data?.message || error.message);
      }
    }
    
    // 4. Получаем все выигранные призы
    console.log('\n4️⃣ Получаем все выигранные призы...');
    const wonPrizesResponse = await axios.get(`${BASE_URL}/api/wheel/won-prizes`, {
      params: { email: 'prizetest@example.com' }
    });
    
    console.log('✅ Выигранные призы получены:');
    console.log(JSON.stringify(wonPrizesResponse.data, null, 2));
    
    // 5. Тестируем с несуществующим пользователем
    console.log('\n5️⃣ Тестируем с несуществующим пользователем...');
    const nonExistentResponse = await axios.get(`${BASE_URL}/api/wheel/won-prizes`, {
      params: { email: 'nonexistent@example.com' }
    });
    
    console.log('✅ Ответ для несуществующего пользователя:', nonExistentResponse.data);
    
    // 6. Тестируем с некорректным email
    console.log('\n6️⃣ Тестируем с некорректным email...');
    try {
      await axios.get(`${BASE_URL}/api/wheel/won-prizes`, {
        params: { email: 'invalid-email' }
      });
    } catch (error) {
      console.log('✅ Ошибка валидации корректна:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🏁 Тестирование завершено!');
    
  } catch (error) {
    console.log('❌ Ошибка тестирования:', error.response?.data || error.message);
  }
}

async function runTest() {
  console.log('🚀 Запуск теста эндпоинта выигранных призов...');
  console.log(`🌐 Базовый URL: ${BASE_URL}\n`);
  
  // Проверяем доступность сервера
  try {
    await axios.get(`${BASE_URL}/api/docs`);
    console.log('✅ Сервер доступен\n');
  } catch (error) {
    console.log('❌ Сервер недоступен. Убедитесь, что приложение запущено на порту 3000');
    return;
  }
  
  await testWonPrizes();
}

// Запускаем тест
runTest().catch(console.error);