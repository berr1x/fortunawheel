import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { MandatoryPrizesService, MandatoryPrize } from './mandatory-prizes.service';
import { BACKEND_URL } from '../config/api.config';
import axios from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Prize {
  id: number;
  name: string;
  total_quantity: number;
  quantity_remaining: number;
  type: string | null;
  image: string | null;
  number: number;
  rotation?: number | null;
}

interface SpinSession {
  id: number;
  user_id: number;
  purchase_id: number;
  spins_total: number;
  spins_used: number;
  is_active: boolean;
}

export interface SpinResult {
  prize: string;
  success: boolean;
  prizeId?: number;
  sessionId?: string;
  prizeImage?: string | null;
  spinsRemaining?: number;
  spinsTotal?: number;
}

/**
 * Сервис для работы с колесом фортуны
 * Управляет сессиями прокруток, логикой выбора призов и резервированием
 */
@Injectable()
export class WheelService {
  private readonly logger = new Logger(WheelService.name);
  private readonly SENDSAY_API_URL = 'https://api.sendsay.ru/general/api/v100/json/cakeschool';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private mandatoryPrizesService: MandatoryPrizesService,
  ) {}

  /**
   * Формирует полный URL изображения приза
   * @param imagePath - Путь к изображению из базы данных
   * @returns Полный URL изображения или null
   */
  private getPrizeImageUrl(imagePath: string | null): string | null {
    if (!imagePath) return null;
    return `${BACKEND_URL}${imagePath}`;
  }

  /**
   * Создание или получение сессии прокруток для пользователя
   * 
   * @param email - Email пользователя
   * @param purchaseId - ID покупки (опционально)
   * @returns Данные сессии с ID и количеством оставшихся прокруток
   */
  async createOrGetSession(email: string, purchaseId?: number) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Найти пользователя по email
      const user = await tx.users.findUnique({
        where: { email: email.toLowerCase() as string },
      });

      // Если пользователь не существует, возвращаем success: false
      if (!user) {
        return {
          success: false,
          message: 'Пользователь не найден.',
          sessionId: null,
          spinsRemaining: 0,
          spinsTotal: 0,
        };
      }

      // 2. Найти активную сессию
      const session = await tx.spin_sessions.findFirst({
        where: {
          user_id: user.id,
          is_active: true,
        },
      });

      // Если есть активная сессия, возвращаем её
      if (session) {
        // Получаем выигранные призы пользователя
        const wonPrizes = await this.getUserWonPrizes(email.toLowerCase() as string);
        
        return {
          success: true,
          message: 'Активная сессия найдена.',
          sessionId: session.id.toString(),
          spinsRemaining: session.spins_total - session.spins_used,
          spinsTotal: session.spins_total,
          wonPrizes: wonPrizes,
        };
      }

      // Если нет активной сессии, проверяем наличие покупок
      const purchases = await tx.purchases.findMany({
        where: {
          user_id: user.id,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Если у пользователя нет покупок, возвращаем success: true с 0 прокрутками
      if (purchases.length === 0) {
        // Получаем выигранные призы пользователя
        const wonPrizes = await this.getUserWonPrizes(email.toLowerCase() as string);
        
        return {
          success: true,
          message: 'У вас нет доступных прокруток.',
          sessionId: null,
          spinsTotal: 0,
          spinsRemaining: 0,
          wonPrizes: wonPrizes,
        };
      }

      // Проверяем, есть ли покупки, для которых еще не создавались сессии
      const purchasesWithSessions = await tx.spin_sessions.findMany({
        where: {
          user_id: user.id,
        },
        select: {
          purchase_id: true,
        },
      });

      const usedPurchaseIds = new Set(purchasesWithSessions.map(s => s.purchase_id));
      const availablePurchases = purchases.filter(p => !usedPurchaseIds.has(p.id));

      // Если все прокруты уже использованы, возвращаем success: true с 0 прокрутками
      if (availablePurchases.length === 0) {
        // Получаем выигранные призы пользователя
        const wonPrizes = await this.getUserWonPrizes(email.toLowerCase() as string);
        
        return {
          success: true,
          message: 'Все ваши прокруты уже использованы.',
          sessionId: null,
          spinsTotal: 0,
          spinsRemaining: 0,
          wonPrizes: wonPrizes,
        };
      }

      // Если передан purchaseId, создаём сессию на основе конкретной покупки
      if (purchaseId) {
        const purchase = availablePurchases.find(p => p.id === purchaseId);
        if (!purchase) {
          // Получаем выигранные призы пользователя
          const wonPrizes = await this.getUserWonPrizes(email.toLowerCase() as string);
          
          return {
            success: true,
            message: 'Указанная покупка не найдена или уже использована.',
            sessionId: null,
            spinsTotal: 0,
            spinsRemaining: 0,
            wonPrizes: wonPrizes,
          };
        }

        const newSession = await tx.spin_sessions.create({
          data: {
            user_id: user.id,
            purchase_id: purchase.id,
            spins_total: purchase.spins_earned,
            spins_used: 0,
            is_active: true,
          },
        });

        // Получаем выигранные призы пользователя
        const wonPrizes = await this.getUserWonPrizes(email.toLowerCase() as string);
        
        return {
          success: true,
          message: 'Новая сессия создана.',
          sessionId: newSession.id.toString(),
          spinsTotal: newSession.spins_total,
          spinsRemaining: newSession.spins_total - newSession.spins_used,
          wonPrizes: wonPrizes,
        };
      }

      // Если purchaseId не передан, создаём сессию на основе первой доступной покупки
      const selectedPurchase = availablePurchases[0];
      const newSession = await tx.spin_sessions.create({
        data: {
          user_id: user.id,
          purchase_id: selectedPurchase.id,
          spins_total: selectedPurchase.spins_earned,
          spins_used: 0,
          is_active: true,
        },
      });

      // Получаем выигранные призы пользователя
      const wonPrizes = await this.getUserWonPrizes(email.toLowerCase() as string);
      
      return {
        success: true,
        message: 'Новая сессия создана.',
        sessionId: newSession.id.toString(),
        spinsTotal: newSession.spins_total,
        spinsRemaining: newSession.spins_total - newSession.spins_used,
        wonPrizes: wonPrizes,
      };
    });
  }

  /**
   * Прокрутка колеса фортуны
   * Основная логика с рандомным выбором приза и резервированием
   * 
   * @param sessionId - ID сессии прокруток
   * @returns Результат прокрутки (приз и статус успеха)
   */
  async spinWheel(sessionId: string): Promise<SpinResult> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Проверить валидность сессии и наличие прокруток
      const session = await tx.spin_sessions.findFirst({
        where: {
          id: parseInt(sessionId),
          is_active: true,
        },
        include: {
          user: true,
          purchase: true,
          results: {
            include: {
              prize: true,
            },
          },
        },
      });

      if (!session) {
        throw new NotFoundException('Сессия не найдена или неактивна');
      }

      if (session.spins_used >= session.spins_total) {
        throw new BadRequestException('Все прокрутки использованы');
      }

      // 2. Получить доступные призы
      const availablePrizes = await tx.prizes.findMany({
        where: {
          quantity_remaining: {
            gt: 0,
          },
        },
        orderBy: {
          number: 'asc',
        },
      });

      if (availablePrizes.length === 0) {
        throw new BadRequestException('Нет доступных призов');
      }

      // 3. Выбрать приз по алгоритму вероятностей
      const selectedPrize = await this.selectPrize(
        availablePrizes,
        session.results,
        session.spins_used,
        session.spins_total,
        tx,
      );

      if (!selectedPrize) {
        throw new BadRequestException('Не удалось выбрать приз');
      }

      // 4. Зарезервировать приз в БД
      await tx.prizes.update({
        where: { id: selectedPrize.id },
        data: {
          quantity_remaining: {
            decrement: 1,
          },
        },
      });

      // 5. Обновить счетчик обязательных подарков, если это был обязательный подарок
      const mandatoryPrizes = await this.mandatoryPrizesService.getActiveMandatoryPrizes();
      const mandatoryPrize = mandatoryPrizes.find(mp => mp.prize.id === selectedPrize.id);
      
      if (mandatoryPrize) {
        await this.mandatoryPrizesService.incrementIssuedQuantity(mandatoryPrize.id);
        console.log(`🎯 Выдан обязательный подарок: ${selectedPrize.name} (${mandatoryPrize.issued_quantity + 1}/${mandatoryPrize.target_quantity})`);
      }

      // 6. Создать запись о результате прокрутки
      const spinResult = await tx.spin_results.create({
        data: {
          spin_session_id: session.id,
          prize_id: selectedPrize.id,
          user_id: session.user_id,
          purchase_id: session.purchase_id,
          status: 'issued',
        },
        include: {
          prize: true,
        },
      });

      // 7. Обновить счетчик использованных прокруток
      await tx.spin_sessions.update({
        where: { id: session.id },
        data: {
          spins_used: {
            increment: 1,
          },
        },
      });

      // 8. Проверить, нужно ли деактивировать сессию
      if (session.spins_used + 1 >= session.spins_total) {
        await tx.spin_sessions.update({
          where: { id: session.id },
          data: {
            is_active: false,
          },
        });
      }

      // 9. Отправить письмо о выпавшем призе
      try {
        await this.sendPrizeEmail(
          session.user.email,
          spinResult.prize.number,
        );
        this.logger.log(`Prize email sent successfully to ${session.user.email} for prize: ${spinResult.prize.name}`);
      } catch (emailError) {
        this.logger.error(`Failed to send prize email to ${session.user.email}:`, emailError);
        // Не прерываем выполнение, если не удалось отправить письмо
      }

      return {
        prize: spinResult.prize.name,
        success: true,
        prizeId: spinResult.prize.id,
        number: spinResult.prize.number,
        sessionId: sessionId,
        prizeImage: this.getPrizeImageUrl(spinResult.prize.image),
        spinsRemaining: session.spins_total - (session.spins_used + 1), // +1 потому что мы уже увеличили spins_used
        spinsTotal: session.spins_total,
      };
    });
  }

  /**
   * Проверяет, нужно ли выдать гарантированный приз
   * 
   * @param spinsUsed - Количество использованных прокруток
   * @param spinsTotal - Общее количество прокруток в сессии
   * @param previousResults - Предыдущие результаты прокруток
   * @param availablePrizes - Доступные призы
   * @returns Гарантированный приз или null
   */
  private checkGuaranteedPrize(
    spinsUsed: number,
    spinsTotal: number,
    previousResults: any[],
    availablePrizes: Prize[]
  ): Prize | null {
    // Гарантированный приз выдается после 5 прокруток
    if (spinsUsed < 5) {
      return null;
    }

    // Находим гарантированные призы (тип 'guaranteed')
    const guaranteedPrizes = availablePrizes.filter(prize => 
      prize.type === 'guaranteed'
    );

    if (guaranteedPrizes.length === 0) {
      return null;
    }

    // Проверяем, был ли уже выдан гарантированный приз в этой сессии
    const wonGuaranteedPrizeIds = previousResults
      .filter(result => guaranteedPrizes.some(gp => gp.id === result.prize_id))
      .map(result => result.prize_id);

    // Если гарантированный приз уже был выдан, не выдаем повторно
    if (wonGuaranteedPrizeIds.length > 0) {
      return null;
    }

    // Определяем, когда выдать гарантированный приз
    const remainingSpins = spinsTotal - spinsUsed;
    
    // Если осталась только 1 прокрутка - выдаем сейчас
    if (remainingSpins === 1) {
      return guaranteedPrizes[0]; // Берем первый доступный гарантированный приз
    }
    
    // Если осталось больше 1 прокрутки - выдаем перед предпоследней прокруткой
    if (remainingSpins === 2) {
      return guaranteedPrizes[0];
    }

    // Если осталось больше 2 прокруток - не выдаем пока
    return null;
  }

  /**
   * Выбор приза по новому алгоритму вероятностей
   * Реализует логику:
   * - Первые 4 прокрутки: неповторяющиеся подарки
   * - 5+ прокруток: могут повторяться
   * - Распределение: 95% обильные, 4.9% ограниченные, 0.1% редкие
   * - Ограничения на призы с количеством < 20
   * - Предотвращение повторных редких призов
   * - Гарантированные призы после 5 прокруток
   * - Overchance призы - всегда выпадают первыми
   * 
   * @param availablePrizes - Доступные призы
   * @param previousResults - Предыдущие результаты прокруток
   * @param spinsUsed - Количество использованных прокруток
   * @param spinsTotal - Общее количество прокруток в сессии
   * @param tx - Транзакция БД
   * @returns Выбранный приз
   */
  private async selectPrize(
    availablePrizes: Prize[],
    previousResults: any[],
    spinsUsed: number,
    spinsTotal: number,
    tx: any,
  ): Promise<Prize | null> {
    // Получаем уже выданные призы в этой сессии
    const wonPrizeIds = previousResults.map(result => result.prize_id);
    
    // Проверяем гарантированный приз (приоритет №1)
    const guaranteedPrize = this.checkGuaranteedPrize(spinsUsed, spinsTotal, previousResults, availablePrizes);
    if (guaranteedPrize) {
      return guaranteedPrize;
    }
    
    // Проверяем overchance призы (приоритет №2) - выпадают первыми
    const overchancePrizes = availablePrizes.filter(prize => prize.type === 'overchance');
    if (overchancePrizes.length > 0) {
      // Применяем ограничения на повторения для overchance призов
      const filteredOverchance = this.filterPrizesByRepetitionLimits(
        overchancePrizes,
        previousResults,
        spinsUsed + 1,
        false
      );
      if (filteredOverchance.length > 0) {
        return this.selectRandomPrize(filteredOverchance);
      }
    }
    
    // Получаем обязательные подарки за последние 24 часа
    const mandatoryPrizes = await this.getMandatoryPrizes(tx);
    
    // Определяем категории призов
    const abundantPrizes = availablePrizes.filter(prize => 
      prize.type === 'many' || prize.quantity_remaining > 1000
    );
    const limitedPrizes = availablePrizes.filter(prize => 
      prize.type === 'limited' || (prize.quantity_remaining >= 100 && prize.quantity_remaining <= 999)
    );
    const rarePrizes = availablePrizes.filter(prize => 
      prize.type === 'rare' || prize.quantity_remaining <= 10
    );
    
    // Призы с ограничениями (количество < 20)
    const restrictedPrizes = availablePrizes.filter(prize => 
      prize.quantity_remaining < 20
    );
    
    // Логика для первых 4 прокруток - неповторяющиеся подарки
    if (spinsUsed < 4) {
      const unclaimedPrizes = availablePrizes.filter(prize => 
        !wonPrizeIds.includes(prize.id)
      );
      
      if (unclaimedPrizes.length > 0) {
        // Приоритет обязательным подаркам, если они не были выданы
        const unclaimedMandatory = unclaimedPrizes.filter(prize => 
          mandatoryPrizes.some(mp => mp.prize.id === prize.id)
        );
        
        if (unclaimedMandatory.length > 0) {
          return this.selectRandomPrize(unclaimedMandatory);
        }
        
        // Применяем новое распределение к неповторяющимся призам
        return await this.selectPrizeByDistribution(unclaimedPrizes, wonPrizeIds, previousResults, spinsUsed + 1, tx);
      }
    }
    
    // Логика для 5+ прокруток - могут повторяться
    if (spinsUsed >= 5) {
      // Сначала проверяем обязательные подарки
      const availableMandatory = availablePrizes.filter(prize => 
        mandatoryPrizes.some(mp => mp.prize.id === prize.id)
      );
      
      if (availableMandatory.length > 0) {
        // Применяем ограничения на повторения для обязательных подарков
        const filteredMandatory = this.filterPrizesByRepetitionLimits(
          availableMandatory,
          previousResults,
          spinsUsed + 1,
          false
        );
        
        if (filteredMandatory.length > 0) {
          // 70% шанс выдать обязательный подарок
          if (Math.random() < 0.7) {
            return this.selectRandomPrize(filteredMandatory);
          }
        }
      }
      
      // Применяем новое распределение ко всем доступным призам
      return await this.selectPrizeByDistribution(availablePrizes, wonPrizeIds, previousResults, spinsUsed + 1, tx);
    }
    
    // Fallback - случайный выбор из всех доступных
    return this.selectRandomPrize(availablePrizes);
  }

  /**
   * Выбор приза по новому распределению с учетом ограничений
   * 
   * @param availablePrizes - Доступные призы
   * @param wonPrizeIds - Уже выигранные призы в сессии
   * @param previousResults - Предыдущие результаты
   * @param spinNumber - Номер прокрутки (1-based)
   * @param tx - Транзакция БД
   * @returns Выбранный приз
   */
  private async selectPrizeByDistribution(
    availablePrizes: Prize[],
    wonPrizeIds: number[],
    previousResults: any[],
    spinNumber: number,
    tx: any
  ): Promise<Prize> {
    // Получаем статистику выдачи призов за последний час
    const distributionStats = await this.getPrizeDistributionStats(60, tx);
    
    // Определяем категории призов
    const abundantPrizes = availablePrizes.filter(prize => 
      prize.type === 'many' || prize.quantity_remaining > 1000
    );
    const limitedPrizes = availablePrizes.filter(prize => 
      prize.type === 'limited' || (prize.quantity_remaining >= 100 && prize.quantity_remaining <= 999)
    );
    const rarePrizes = availablePrizes.filter(prize => 
      prize.type === 'rare' || prize.quantity_remaining <= 10
    );
    
    // Призы с ограничениями (количество < 20)
    const restrictedPrizes = availablePrizes.filter(prize => 
      prize.quantity_remaining < 20
    );
    
    // Проверяем ограничения на призы с количеством < 20
    const availableRestricted = restrictedPrizes.filter(prize => 
      !wonPrizeIds.includes(prize.id)
    );
    
    // Если есть доступные ограниченные призы, исключаем их из обычного распределения
    const filteredAbundant = abundantPrizes.filter(prize => 
      !restrictedPrizes.some(rp => rp.id === prize.id)
    );
    const filteredLimited = limitedPrizes.filter(prize => 
      !restrictedPrizes.some(rp => rp.id === prize.id)
    );
    const filteredRare = rarePrizes.filter(prize => 
      !restrictedPrizes.some(rp => rp.id === prize.id)
    );
    
    // Применяем ограничения на повторения для каждой категории
    const abundantWithLimits = this.filterPrizesByRepetitionLimits(
      filteredAbundant, 
      previousResults, 
      spinNumber, 
      false
    );
    const limitedWithLimits = this.filterPrizesByRepetitionLimits(
      filteredLimited, 
      previousResults, 
      spinNumber, 
      false
    );
    const rareWithLimits = this.filterPrizesByRepetitionLimits(
      filteredRare, 
      previousResults, 
      spinNumber, 
      true
    );
    
    // Взвешенный выбор с учетом количества и статистики
    const random = Math.random();
    
    // 95% шанс на обильные призы
    if (random < 0.95 && abundantWithLimits.length > 0) {
      return await this.selectWeightedPrizeWithStats(abundantWithLimits, distributionStats, tx);
    }
    // 4.9% шанс на ограниченные призы
    else if (random < 0.999 && limitedWithLimits.length > 0) {
      return await this.selectWeightedPrizeWithStats(limitedWithLimits, distributionStats, tx);
    }
    // 0.1% шанс на редкие призы (если предыдущий не был редким)
    else if (random < 1.0 && rareWithLimits.length > 0) {
      return await this.selectWeightedPrizeWithStats(rareWithLimits, distributionStats, tx);
    }
    // Если нет призов в основных категориях, выбираем из доступных ограниченных
    else if (availableRestricted.length > 0) {
      return await this.selectWeightedPrizeWithStats(availableRestricted, distributionStats, tx);
    }
    // Fallback - случайный выбор из всех доступных
    else {
      return this.selectRandomPrize(availablePrizes);
    }
  }

  /**
   * Определяет максимально допустимое количество повторений для обычных призов
   * в зависимости от номера прокрутки
   * 
   * @param spinNumber - Номер прокрутки (1-based)
   * @returns Максимальное количество повторений
   */
  private getMaxAllowedRepetitions(spinNumber: number): number {
    if (spinNumber <= 9) {
      return 2; // До 9 прокруток включительно - максимум 2 одинаковых приза
    } else {
      return 3; // С 10 прокрутки и далее - максимум 3 одинаковых приза
    }
  }

  /**
   * Подсчитывает количество повторений конкретного приза в сессии
   * 
   * @param prizeId - ID приза
   * @param previousResults - Предыдущие результаты прокруток
   * @returns Количество повторений
   */
  private countPrizeRepetitions(prizeId: number, previousResults: any[]): number {
    return previousResults.filter(result => result.prize_id === prizeId).length;
  }

  /**
   * Фильтрует призы с учетом ограничений на повторения
   * 
   * @param prizes - Массив призов для фильтрации
   * @param previousResults - Предыдущие результаты прокруток
   * @param spinNumber - Номер прокрутки (1-based)
   * @param isRare - Являются ли призы редкими
   * @returns Отфильтрованный массив призов
   */
  private filterPrizesByRepetitionLimits(
    prizes: Prize[],
    previousResults: any[],
    spinNumber: number,
    isRare: boolean = false
  ): Prize[] {
    if (isRare) {
      // Для редких призов - строгие ограничения
      const lastPrize = previousResults[previousResults.length - 1];
      const wasLastPrizeRare = lastPrize && prizes.some(p => p.id === lastPrize.prize_id);
      
      // Исключаем редкие призы, если предыдущий был редким
      if (wasLastPrizeRare) {
        return [];
      }
      
      // Дополнительное ограничение: редкие призы не чаще чем раз в 50 прокруток
      const rarePrizeCount = previousResults.filter(result => 
        prizes.some(p => p.id === result.prize_id)
      ).length;
      
      // Если уже было больше 1 редкого приза на каждые 50 прокруток, исключаем
      const maxRarePer50Spins = Math.floor(spinNumber / 50);
      if (rarePrizeCount >= maxRarePer50Spins) {
        return [];
      }
      
      // Дополнительная проверка: если в последних 20 прокрутках был редкий приз, исключаем
      const recentRareCount = previousResults.slice(-20).filter(result => 
        prizes.some(p => p.id === result.prize_id)
      ).length;
      
      if (recentRareCount > 0) {
        return [];
      }
      
      return prizes;
    }

    // Для обычных призов - применяем ограничения на повторения
    const maxRepetitions = this.getMaxAllowedRepetitions(spinNumber);
    
    return prizes.filter(prize => {
      const repetitions = this.countPrizeRepetitions(prize.id, previousResults);
      // Если repetitions = maxRepetitions, значит уже было выдано максимальное количество
      // следующий приз будет превышать лимит, поэтому используем строгое сравнение
      return repetitions < maxRepetitions;
    });
  }

  /**
   * Получает статистику выдачи призов за последние N минут
   * 
   * @param minutes - Количество минут для анализа
   * @param tx - Транзакция БД
   * @returns Статистика выдачи призов
   */
  private async getPrizeDistributionStats(minutes: number = 60, tx: any): Promise<Map<number, number>> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    
    const results = await tx.spin_results.findMany({
      where: {
        created_at: {
          gte: cutoffTime,
        },
      },
      select: {
        prize_id: true,
      },
    });

    const stats = new Map<number, number>();
    results.forEach(result => {
      const count = stats.get(result.prize_id) || 0;
      stats.set(result.prize_id, count + 1);
    });

    return stats;
  }

  /**
   * Рассчитывает динамический вес для приза на основе его редкости и статистики выдачи
   * 
   * @param prize - Приз для расчета веса
   * @param distributionStats - Статистика выдачи призов
   * @param totalUsersEstimate - Примерное количество пользователей за период
   * @returns Динамический вес приза
   */
  private calculateDynamicWeight(
    prize: Prize, 
    distributionStats: Map<number, number>,
    totalUsersEstimate: number = 2000
  ): number {
    // Базовый вес = количество оставшихся призов
    let weight = prize.quantity_remaining;
    
    // Получаем количество уже выданных призов за период
    const issuedCount = distributionStats.get(prize.id) || 0;
    
    // Рассчитываем процент уже выданных призов от общего количества
    const issuedPercentage = prize.total_quantity > 0 ? 
      (issuedCount / prize.total_quantity) : 0;
    
    // Рассчитываем ожидаемый процент выдачи для данного типа приза
    let expectedPercentage = 0;
    if (prize.type === 'rare' || prize.quantity_remaining <= 10) {
      expectedPercentage = 0.0001; // 0.01% для редких (в 10 раз меньше!)
    } else if (prize.type === 'limited' || (prize.quantity_remaining >= 100 && prize.quantity_remaining <= 999)) {
      expectedPercentage = 0.01; // 1% для ограниченных
    } else {
      expectedPercentage = 0.08; // 8% для обильных
    }
    
    // Если приз уже выдавался слишком часто относительно ожидаемого, снижаем вес
    if (issuedPercentage > expectedPercentage * 2) {
      weight *= 0.01; // Очень низкий вес
    } else if (issuedPercentage > expectedPercentage * 1.5) {
      weight *= 0.1; // Низкий вес
    } else if (issuedPercentage > expectedPercentage) {
      weight *= 0.5; // Средний вес
    }
    
    // Дополнительные модификаторы на основе типа
    if (prize.type === 'many') {
      weight *= 1.5; // Увеличиваем вес для обильных призов
    } else if (prize.type === 'limited') {
      weight *= 1.0; // Нейтральный вес
    } else if (prize.type === 'rare') {
      weight *= 0.001; // Экстремально низкий вес для редких
    }
    
    // Дополнительное уменьшение веса для очень редких призов
    if (prize.quantity_remaining <= 5) {
      weight *= 0.0001; // Практически нулевой вес для крайне редких
    } else if (prize.quantity_remaining <= 10) {
      weight *= 0.001; // Экстремально низкий вес для редких
    } else if (prize.quantity_remaining <= 20) {
      weight *= 0.01; // Очень низкий вес для ограниченных
    }
    
    // Временной фактор - если приз выдавался недавно, снижаем вес
    const recentIssued = distributionStats.get(prize.id) || 0;
    if (recentIssued > 0) {
      // Чем больше недавних выдач, тем ниже вес
      weight *= Math.pow(0.1, recentIssued);
    }
    
    return Math.max(weight, 0.001); // Минимальный вес
  }

  /**
   * Взвешенный выбор приза на основе количества и динамических весов
   * 
   * @param prizes - Массив призов для выбора
   * @param distributionStats - Статистика выдачи призов
   * @param tx - Транзакция БД
   * @returns Выбранный приз
   */
  private async selectWeightedPrizeWithStats(
    prizes: Prize[], 
    distributionStats: Map<number, number>,
    tx: any
  ): Promise<Prize> {
    if (prizes.length === 0) {
      throw new Error('Нет призов для выбора');
    }
    
    // Если только один приз, возвращаем его
    if (prizes.length === 1) {
      return prizes[0];
    }
    
    // Вычисляем динамические веса
    const weights = prizes.map(prize => 
      this.calculateDynamicWeight(prize, distributionStats)
    );
    
    // Вычисляем общий вес
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // Генерируем случайное число
    const random = Math.random() * totalWeight;
    
    // Находим приз по весу
    let currentWeight = 0;
    for (let i = 0; i < prizes.length; i++) {
      currentWeight += weights[i];
      if (random <= currentWeight) {
        return prizes[i];
      }
    }
    
    // Fallback - возвращаем последний приз
    return prizes[prizes.length - 1];
  }

  /**
   * Взвешенный выбор приза на основе количества
   * Чем больше количество, тем выше вероятность выбора
   * 
   * @param prizes - Массив призов для выбора
   * @returns Выбранный приз
   */
  private selectWeightedPrize(prizes: Prize[]): Prize {
    if (prizes.length === 0) {
      throw new Error('Нет призов для выбора');
    }
    
    // Если только один приз, возвращаем его
    if (prizes.length === 1) {
      return prizes[0];
    }
    
    // Вычисляем веса на основе количества
    const weights = prizes.map(prize => {
      // Базовый вес = количество оставшихся призов
      let weight = prize.quantity_remaining;
      
      // Дополнительные модификаторы на основе типа
      if (prize.type === 'many') {
        weight *= 1.5; // Увеличиваем вес для обильных призов
      } else if (prize.type === 'limited') {
        weight *= 1.0; // Нейтральный вес
      } else if (prize.type === 'rare') {
        weight *= 0.08; // Значительно уменьшаем вес для редких
      }
      
      // Дополнительное уменьшение веса для очень редких призов
      if (prize.quantity_remaining <= 5) {
        weight *= 0.01; // Очень низкий вес для крайне редких
      } else if (prize.quantity_remaining <= 10) {
        weight *= 0.04; // Низкий вес для редких
      }
      
      return Math.max(weight, 0.01); // Минимальный вес
    });
    
    // Вычисляем общий вес
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // Генерируем случайное число
    const random = Math.random() * totalWeight;
    
    // Находим приз по весу
    let currentWeight = 0;
    for (let i = 0; i < prizes.length; i++) {
      currentWeight += weights[i];
      if (random <= currentWeight) {
        return prizes[i];
      }
    }
    
    // Fallback - возвращаем последний приз
    return prizes[prizes.length - 1];
  }

  /**
   * Получение обязательных подарков за последние 24 часа
   * 
   * @param tx - Транзакция БД
   * @returns Массив обязательных подарков
   */
  private async getMandatoryPrizes(tx: any): Promise<MandatoryPrize[]> {
    // Получаем приоритетные обязательные подарки
    return await this.mandatoryPrizesService.getPriorityMandatoryPrizes();
  }

  /**
   * Случайный выбор приза из массива
   * 
   * @param prizes - Массив призов для выбора
   * @returns Случайно выбранный приз
   */
  private selectRandomPrize(prizes: Prize[]): Prize {
    if (prizes.length === 0) {
      throw new Error('Нет призов для выбора');
    }
    
    const randomIndex = Math.floor(Math.random() * prizes.length);
    return prizes[randomIndex];
  }

  /**
   * Получение списка доступных призов
   * 
   * @returns Массив призов с количеством > 0
   */
  async getAvailablePrizes(): Promise<Prize[]> {
    const prizes = await this.prisma.prizes.findMany({
      orderBy: {
        number: 'asc',
      },
    });

    // Добавляем полные URL для изображений
    return prizes.map(prize => ({
      ...prize,
      image: this.getPrizeImageUrl(prize.image),
    }));
  }

  /**
   * Получение всех выигранных призов пользователя
   * 
   * @param email - Email пользователя
   * @returns Массив выигранных призов с деталями
   */
  async getUserWonPrizes(email: string) {
    // Находим пользователя
    const user = await this.prisma.users.findUnique({
      where: { email: email.toLowerCase() as string },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Получаем все результаты прокруток пользователя с информацией о призах
    const wonPrizes = await this.prisma.spin_results.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        prize: {
          select: {
            id: true,
            name: true,
            type: true,
            image: true,
          },
        },
        session: {
          select: {
            id: true,
            created_at: true,
          },
        },
        purchase: {
          select: {
            id: true,
            order_id: true,
            amount: true,
            created_at: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Форматируем результат с полными URL изображений
    return wonPrizes.map(result => ({
      id: result.id,
      prize: {
        id: result.prize.id,
        name: result.prize.name,
        type: result.prize.type,
        image: this.getPrizeImageUrl(result.prize.image),
      },
      session: {
        id: result.session.id,
        createdAt: result.session.created_at,
      },
      purchase: {
        id: result.purchase.id,
        orderId: result.purchase.order_id,
        amount: result.purchase.amount,
        createdAt: result.purchase.created_at,
      },
      status: result.status,
      wonAt: result.created_at,
    }));
  }

  /**
   * Загружает HTML шаблон для письма с выпавшим призом в зависимости от номера приза
   * @param prizeNumber - Номер приза (1-12)
   * @returns HTML содержимое письма
   */
  private getPrizeEmailHTML(prizeNumber: number): string {
    // Маппинг номеров призов на имена файлов
    const prizeFileMap: Record<number, string> = {
      1: 'item_mycake.html',
      2: 'item_mixer.html',
      3: 'item_browny.html',
      4: 'item_book.html',
      5: 'item_promocode.html',
      6: 'item_blackticket.html',
      7: 'item_blender.html',
      8: 'item_guide.html',
      9: 'item_mooncake.html',
      10: 'item_conditerbox.html',
      11: 'item_laws.html',
      12: 'item_goldticket.html',
    };

    const fileName = prizeFileMap[prizeNumber];
    if (!fileName) {
      this.logger.error(`Unknown prize number: ${prizeNumber}`);
      throw new BadRequestException(`Unknown prize number: ${prizeNumber}`);
    }

    try {
      const templatePath = join(__dirname, '..', 'mails', fileName);
      const html = readFileSync(templatePath, 'utf-8');
      this.logger.log(`Loaded prize email template: ${fileName} for prize number ${prizeNumber}`);
      return html;
    } catch (error) {
      this.logger.error(`Failed to load prize email template ${fileName}:`, error);
      throw new Error(`Failed to load prize email template: ${fileName}`);
    }
  }

  /**
   * Получает subject письма в зависимости от номера приза
   * @param prizeNumber - Номер приза (1-12)
   * @returns Subject письма
   */
  private getPrizeEmailSubject(prizeNumber: number): string {
    const prizeSubjectMap: Record<number, string> = {
      1: 'Ваш подарок — промокод My Cake🎁',
      2: 'Ваш подарок — миксер🎁',
      3: 'Ваш подарок — мини-курс🎁',
      4: 'Ваш подарок — книга🎁',
      5: 'Ваш подарок — промокод на обучение🎁',
      6: 'Ваш подарок — чёрный билет🎁',
      7: 'Ваш подарок — блендер 🎁',
      8: 'Ваш подарок — гайд🎁',
      9: 'Ваш подарок — мини-курс🎁',
      10: 'Ваш подарок — бокс кондитера 🎁',
      11: 'Ваш подарок — гайд🎁',
      12: 'Ваш подарок — золотой билет🎁',
    };

    const subject = prizeSubjectMap[prizeNumber];
    if (!subject) {
      this.logger.error(`Unknown prize number: ${prizeNumber}`);
      throw new BadRequestException(`Unknown prize number: ${prizeNumber}`);
    }

    return subject;
  }

  /**
   * Форматирует дату для Sendsay API (YYYY:MM:DD hh:mm)
   * @param date - Дата для форматирования
   * @returns Отформатированная строка даты аку
   */
  private formatDateForSendsay(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * Отправляет письмо о выпавшем призе через Sendsay API
   * @param email - Email получателя
   * @param prizeNumber - Номер приза (1-12)
   * @returns Результат отправки письма
   */
  private async sendPrizeEmail(email: string, prizeNumber: number) {
    try {
      // Рассчитываем время отправки (текущее время + 5 минут)
      const sendTime = new Date();
      sendTime.setMinutes(sendTime.getMinutes() + 5);

      const requestData = {
        action: 'issue.send',
        letter: {
          message: {
            html: this.getPrizeEmailHTML(prizeNumber)
          },
          subject: this.getPrizeEmailSubject(prizeNumber),
          'from.email': 'mail@info.cake-school.com',
          'from.name': 'Колесо фортуны'
        },
        group: 'personal',
        email: email,
        sendwhen: 'now',
        // 'later.time': this.formatDateForSendsay(sendTime)
      };

      const response = await axios.post(this.SENDSAY_API_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sendsay apikey=19mD7PhStSbesR1odSpR24Khd3-t_k0_-wkURlnXjWMrRitejwbu4staPSK-i5JKYjRwR6Opr',
        },
        timeout: 10000, // 10 секунд таймаут
      });

      this.logger.log(`Prize email scheduled for ${email} at ${this.formatDateForSendsay(sendTime)}:`, response.data);
      return response.data;
    } catch (error) {
      this.logger.error(`Error sending prize email to ${email}:`, error.response?.data || error.message);
      throw error;
    }
  }
}