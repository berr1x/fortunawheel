/**
 * Простой тест для проверки работы API колеса фортуны
 * Запуск: node test-wheel.js
 */

const API_BASE = 'http://localhost:3000/api';

async function testWheelAPI() {
  console.log('🎰 Тестирование API колеса фортуны...\n');

  try {
    // 1. Создание сессии
    console.log('1. Создание сессии...');
    const sessionResponse = await fetch(`${API_BASE}/wheel/session?email=test@example.com`);
    const session = await sessionResponse.json();
    
    if (!sessionResponse.ok) {
      throw new Error(`Ошибка создания сессии: ${session.message || 'Неизвестная ошибка'}`);
    }
    
    console.log('✅ Сессия создана:', session);
    const sessionId = session.sessionId;

    // 2. Получение доступных призов
    console.log('\n2. Получение доступных призов...');
    const prizesResponse = await fetch(`${API_BASE}/wheel/prizes`);
    const prizes = await prizesResponse.json();
    console.log('✅ Доступные призы:', prizes);

    // 3. Прокрутки колеса
    console.log('\n3. Прокрутки колеса...');
    const spins = Math.min(session.spinsRemaining, 7); // Тестируем до 7 прокруток
    
    for (let i = 1; i <= spins; i++) {
      console.log(`\n   Прокрутка ${i}/${spins}:`);
      
      const spinResponse = await fetch(`${API_BASE}/wheel/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      const result = await spinResponse.json();
      
      if (!spinResponse.ok) {
        console.log(`   ❌ Ошибка: ${result.message || 'Неизвестная ошибка'}`);
        break;
      }
      
      console.log(`   🎁 Выигранный приз: ${result.prize}`);
      console.log(`   📊 Статус: ${result.success ? 'Успешно' : 'Ошибка'}`);
      
      // Небольшая пауза между прокрутками
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Запуск теста
testWheelAPI();