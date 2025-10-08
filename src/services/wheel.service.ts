import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { MandatoryPrizesService, MandatoryPrize } from './mandatory-prizes.service';
import { BACKEND_URL } from '../config/api.config';

interface Prize {
  id: number;
  name: string;
  total_quantity: number;
  quantity_remaining: number;
  type: string | null;
  image: string | null;
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
        where: { email },
      });

      // Если пользователь не существует, возвращаем success: false
      if (!user) {
        return {
          success: false,
          message: 'Пользователь не найден.',
          sessionId: null,
          spinsRemaining: 0,
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
        const wonPrizes = await this.getUserWonPrizes(email);
        
        return {
          success: true,
          message: 'Активная сессия найдена.',
          sessionId: session.id.toString(),
          spinsRemaining: session.spins_total - session.spins_used,
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
        const wonPrizes = await this.getUserWonPrizes(email);
        
        return {
          success: true,
          message: 'У вас нет доступных прокруток.',
          sessionId: null,
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
        const wonPrizes = await this.getUserWonPrizes(email);
        
        return {
          success: true,
          message: 'Все ваши прокруты уже использованы.',
          sessionId: null,
          spinsRemaining: 0,
          wonPrizes: wonPrizes,
        };
      }

      // Если передан purchaseId, создаём сессию на основе конкретной покупки
      if (purchaseId) {
        const purchase = availablePurchases.find(p => p.id === purchaseId);
        if (!purchase) {
          // Получаем выигранные призы пользователя
          const wonPrizes = await this.getUserWonPrizes(email);
          
          return {
            success: true,
            message: 'Указанная покупка не найдена или уже использована.',
            sessionId: null,
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
        const wonPrizes = await this.getUserWonPrizes(email);
        
        return {
          success: true,
          message: 'Новая сессия создана.',
          sessionId: newSession.id.toString(),
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
      const wonPrizes = await this.getUserWonPrizes(email);
      
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
          id: 'asc',
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

      return {
        prize: spinResult.prize.name,
        success: true,
        prizeId: spinResult.prize.id,
        sessionId: sessionId,
        prizeImage: this.getPrizeImageUrl(spinResult.prize.image),
        spinsRemaining: session.spins_total - (session.spins_used + 1), // +1 потому что мы уже увеличили spins_used
        spinsTotal: session.spins_total,
      };
    });
  }

  /**
   * Выбор приза по алгоритму вероятностей
   * Реализует логику:
   * - Первые 5 прокруток: неповторяющиеся подарки
   * - 6+ прокруток: могут повторяться, но обязательно выпадают подарки с большим количеством
   * - Обязательные подарки в течение 24 часов
   * 
   * @param availablePrizes - Доступные призы
   * @param previousResults - Предыдущие результаты прокруток
   * @param spinsUsed - Количество использованных прокруток
   * @param tx - Транзакция БД
   * @returns Выбранный приз
   */
  private async selectPrize(
    availablePrizes: Prize[],
    previousResults: any[],
    spinsUsed: number,
    tx: any,
  ): Promise<Prize | null> {
    // Получаем уже выданные призы в этой сессии
    const wonPrizeIds = previousResults.map(result => result.prize_id);
    
    // Получаем обязательные подарки за последние 24 часа
    const mandatoryPrizes = await this.getMandatoryPrizes(tx);
    
    // Логика для первых 5 прокруток - неповторяющиеся подарки
    if (spinsUsed < 5) {
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
        
        return this.selectRandomPrize(unclaimedPrizes);
      }
    }
    
    // Логика для 6+ прокруток - могут повторяться
    if (spinsUsed >= 5) {
      // Сначала проверяем обязательные подарки
      const availableMandatory = availablePrizes.filter(prize => 
        mandatoryPrizes.some(mp => mp.prize.id === prize.id)
      );
      
      if (availableMandatory.length > 0) {
        // 70% шанс выдать обязательный подарок
        if (Math.random() < 0.7) {
          return this.selectRandomPrize(availableMandatory);
        }
      }
      
      // Разделяем призы по типам для взвешенного выбора
      const abundantPrizes = availablePrizes.filter(prize => 
        prize.type === 'many' || prize.quantity_remaining > 50
      );
      const limitedPrizes = availablePrizes.filter(prize => 
        prize.type === 'limited' || (prize.quantity_remaining <= 50 && prize.quantity_remaining > 10)
      );
      const rarePrizes = availablePrizes.filter(prize => 
        prize.type === 'rare' || prize.quantity_remaining <= 10
      );
      
      // Взвешенный выбор: 60% - обильные, 30% - ограниченные, 10% - редкие
      const random = Math.random();
      
      if (random < 0.6 && abundantPrizes.length > 0) {
        return this.selectRandomPrize(abundantPrizes);
      } else if (random < 0.9 && limitedPrizes.length > 0) {
        return this.selectRandomPrize(limitedPrizes);
      } else if (rarePrizes.length > 0) {
        return this.selectRandomPrize(rarePrizes);
      }
    }
    
    // Fallback - случайный выбор из всех доступных
    return this.selectRandomPrize(availablePrizes);
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
      where: {
        quantity_remaining: {
          gt: 0,
        },
      },
      orderBy: {
        id: 'asc',
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
      where: { email },
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
}