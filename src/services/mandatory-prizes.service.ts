import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { BACKEND_URL } from '../config/api.config';

export interface MandatoryPrize {
  id: number;
  prize_id: number;
  target_quantity: number;
  issued_quantity: number;
  period_start: Date;
  period_end: Date;
  is_active: boolean;
  prize: {
    id: number;
    name: string;
    quantity_remaining: number;
    image: string | null;
  };
}

@Injectable()
export class MandatoryPrizesService {
  constructor(private prisma: PrismaService) {}

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
   * Создание нового периода обязательных подарков
   * 
   * @param prizeId - ID приза
   * @param targetQuantity - Целевое количество для выдачи за 24 часа
   * @returns Созданная запись обязательного подарка
   */
  async createMandatoryPrize(prizeId: number, targetQuantity: number): Promise<MandatoryPrize> {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 часа

    const mandatoryPrize = await this.prisma.mandatory_prizes.create({
      data: {
        prize_id: prizeId,
        target_quantity: targetQuantity,
        issued_quantity: 0,
        period_start: now,
        period_end: periodEnd,
        is_active: true,
      },
      include: {
        prize: {
          select: {
            id: true,
            name: true,
            quantity_remaining: true,
            image: true,
          },
        },
      },
    });

    // Добавляем полный URL для изображения
    return {
      ...mandatoryPrize,
      prize: {
        ...mandatoryPrize.prize,
        image: this.getPrizeImageUrl(mandatoryPrize.prize.image),
      },
    };
  }

  /**
   * Получение активных обязательных подарков
   * 
   * @returns Массив активных обязательных подарков
   */
  async getActiveMandatoryPrizes(): Promise<MandatoryPrize[]> {
    const now = new Date();

    const mandatoryPrizes = await this.prisma.mandatory_prizes.findMany({
      where: {
        is_active: true,
        period_start: {
          lte: now,
        },
        period_end: {
          gte: now,
        },
      },
      include: {
        prize: {
          select: {
            id: true,
            name: true,
            quantity_remaining: true,
            image: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Добавляем полные URL для изображений
    return mandatoryPrizes.map(mandatoryPrize => ({
      ...mandatoryPrize,
      prize: {
        ...mandatoryPrize.prize,
        image: this.getPrizeImageUrl(mandatoryPrize.prize.image),
      },
    }));
  }

  /**
   * Увеличение счетчика выданных обязательных подарков
   * 
   * @param mandatoryPrizeId - ID записи обязательного подарка
   * @returns Обновленная запись
   */
  async incrementIssuedQuantity(mandatoryPrizeId: number): Promise<MandatoryPrize> {
    const mandatoryPrize = await this.prisma.mandatory_prizes.update({
      where: { id: mandatoryPrizeId },
      data: {
        issued_quantity: {
          increment: 1,
        },
      },
      include: {
        prize: {
          select: {
            id: true,
            name: true,
            quantity_remaining: true,
            image: true,
          },
        },
      },
    });

    // Добавляем полный URL для изображения
    return {
      ...mandatoryPrize,
      prize: {
        ...mandatoryPrize.prize,
        image: this.getPrizeImageUrl(mandatoryPrize.prize.image),
      },
    };
  }

  /**
   * Проверка, нужно ли выдать обязательный подарок
   * 
   * @param mandatoryPrize - Запись обязательного подарка
   * @returns true, если нужно выдать подарок
   */
  shouldIssueMandatoryPrize(mandatoryPrize: MandatoryPrize): boolean {
    const now = new Date();
    const timeRemaining = mandatoryPrize.period_end.getTime() - now.getTime();
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
    const prizesRemaining = mandatoryPrize.target_quantity - mandatoryPrize.issued_quantity;

    // Если осталось меньше 2 часов и есть невыданные подарки
    if (hoursRemaining <= 2 && prizesRemaining > 0) {
      return true;
    }

    // Если осталось меньше 6 часов и не выдано больше половины
    if (hoursRemaining <= 6 && mandatoryPrize.issued_quantity < mandatoryPrize.target_quantity / 2) {
      return true;
    }

    return false;
  }

  /**
   * Получение приоритетных обязательных подарков для выдачи
   * 
   * @returns Массив приоритетных обязательных подарков
   */
  async getPriorityMandatoryPrizes(): Promise<MandatoryPrize[]> {
    const activePrizes = await this.getActiveMandatoryPrizes();
    
    return activePrizes.filter(prize => this.shouldIssueMandatoryPrize(prize));
  }

  /**
   * Деактивация завершенных периодов
   * 
   * @returns Количество деактивированных записей
   */
  async deactivateExpiredPeriods(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.mandatory_prizes.updateMany({
      where: {
        is_active: true,
        period_end: {
          lt: now,
        },
      },
      data: {
        is_active: false,
      },
    });

    return result.count;
  }

  /**
   * Создание ежедневных обязательных подарков
   * Пример: каждый день должно быть выдано 5 миксеров, 100 книг, 2 золотых билета
   */
  async createDailyMandatoryPrizes(): Promise<void> {
    // Сначала деактивируем старые периоды
    await this.deactivateExpiredPeriods();

    // Создаем новые обязательные подарки на сегодня
    const dailyTargets = [
      { prizeId: 8, targetQuantity: 1 }, // Золотой билет - 1 в день
      { prizeId: 9, targetQuantity: 2 }, // Черный билет - 2 в день
      { prizeId: 10, targetQuantity: 3 }, // Миксер - 3 в день
      { prizeId: 11, targetQuantity: 3 }, // Блендер - 3 в день
      { prizeId: 12, targetQuantity: 2 }, // Бокс Кондитера - 2 в день
    ];

    for (const target of dailyTargets) {
      // Проверяем, есть ли уже активный период для этого приза
      const existing = await this.prisma.mandatory_prizes.findFirst({
        where: {
          prize_id: target.prizeId,
          is_active: true,
        },
      });

      if (!existing) {
        await this.createMandatoryPrize(target.prizeId, target.targetQuantity);
      }
    }
  }
}