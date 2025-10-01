/**
 * Тест системы обязательных подарков
 * Запуск: node test-mandatory-prizes.js
 */

const API_BASE = 'http://localhost:3000/api';

async function testMandatoryPrizes() {
  console.log('🎯 Тестирование системы обязательных подарков...\n');

  try {
    // 1. Создание ежедневных обязательных подарков
    console.log('1. Создание ежедневных обязательных подарков...');
    const dailyResponse = await fetch(`${API_BASE}/mandatory-prizes/daily`, {
      method: 'POST',
    });
    const dailyResult = await dailyResponse.json();
    console.log('✅ Результат:', dailyResult);

    // 2. Получение активных обязательных подарков
    console.log('\n2. Получение активных обязательных подарков...');
    const activeResponse = await fetch(`${API_BASE}/mandatory-prizes/active`);
    const activePrizes = await activeResponse.json();
    console.log('✅ Активные обязательные подарки:');
    activePrizes.forEach(prize => {
      console.log(`   - ${prize.prize.name}: ${prize.issued_quantity}/${prize.target_quantity} выдано`);
      console.log(`     Период: ${new Date(prize.period_start).toLocaleString()} - ${new Date(prize.period_end).toLocaleString()}`);
    });

    // 3. Получение приоритетных подарков
    console.log('\n3. Получение приоритетных подарков...');
    const priorityResponse = await fetch(`${API_BASE}/mandatory-prizes/priority`);
    const priorityPrizes = await priorityResponse.json();
    console.log('✅ Приоритетные подарки для выдачи:');
    priorityPrizes.forEach(prize => {
      console.log(`   - ${prize.prize.name}: ${prize.issued_quantity}/${prize.target_quantity} выдано`);
    });

    // 4. Тестирование прокрутки с обязательными подарками
    console.log('\n4. Тестирование прокрутки с обязательными подарками...');
    
    // Создаем сессию
    const sessionResponse = await fetch(`${API_BASE}/wheel/session?email=mandatory-test@example.com`);
    const session = await sessionResponse.json();
    console.log('✅ Сессия создана:', session.sessionId);

    // Делаем несколько прокруток
    const spins = Math.min(session.spinsRemaining, 5);
    for (let i = 1; i <= spins; i++) {
      console.log(`\n   Прокрутка ${i}/${spins}:`);
      
      const spinResponse = await fetch(`${API_BASE}/wheel/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: session.sessionId }),
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

    // 5. Проверяем обновленные счетчики
    console.log('\n5. Проверка обновленных счетчиков...');
    const updatedActiveResponse = await fetch(`${API_BASE}/mandatory-prizes/active`);
    const updatedActivePrizes = await updatedActiveResponse.json();
    console.log('✅ Обновленные счетчики:');
    updatedActivePrizes.forEach(prize => {
      console.log(`   - ${prize.prize.name}: ${prize.issued_quantity}/${prize.target_quantity} выдано`);
    });

    console.log('\n✅ Тестирование системы обязательных подарков завершено!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Запуск теста
testMandatoryPrizes();