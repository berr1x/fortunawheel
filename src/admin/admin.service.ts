import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import * as XLSX from 'xlsx';


/**
 * Сервис для админки - управление пользователями, призами и обязательными призами
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========

  /**
   * Получить список всех пользователей с дополнительной информацией
   */
  async getUsers(search?: string) {
    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { customer_email: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const users = await this.prisma.users.findMany({
      where,
      include: {
        purchases: {
          select: {
            amount: true,
            spins_earned: true,
            created_at: true
          }
        },
        spin_sessions: {
          select: {
            spins_total: true,
            spins_used: true,
            is_active: true
          }
        },
        spin_results: {
          include: {
            prize: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Обрабатываем данные для удобного отображения
    return users.map(user => {
      const totalPurchaseAmount = user.purchases.reduce((sum, p) => sum + p.amount, 0);
      const totalSpinsEarned = user.purchases.reduce((sum, p) => sum + p.spins_earned, 0);
      const totalSpinsUsed = user.spin_sessions.reduce((sum, s) => sum + s.spins_used, 0);
      
      // Группируем выигранные призы по ID приза для правильного подсчета дубликатов
      const wonPrizes = user.spin_results.reduce((acc, result) => {
        const prizeId = result.prize.id;
        const prizeName = result.prize.name;
        if (!acc[prizeId]) {
          acc[prizeId] = {
            id: prizeId,
            name: prizeName,
            type: result.prize.type,
            count: 0
          };
        }
        acc[prizeId].count++;
        return acc;
      }, {} as Record<number, { id: number; name: string; type: string; count: number }>);

      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        totalPurchaseAmount,
        totalSpinsEarned,
        totalSpinsUsed,
        spinsRemaining: totalSpinsEarned - totalSpinsUsed,
        wonPrizes: Object.values(wonPrizes),
        purchasesCount: user.purchases.length,
        sessionsCount: user.spin_sessions.length
      };
    });
  }

  async getUserById(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        purchases: {
          select: {
            amount: true,
            spins_earned: true,
            created_at: true
          }
        },
        spin_sessions: {
          select: {
            spins_total: true,
            spins_used: true,
            is_active: true
          }
        },
        spin_results: {
          include: {
            prize: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    // Обрабатываем данные для удобного отображения
    const totalPurchaseAmount = user.purchases.reduce((sum, p) => sum + p.amount, 0);
    const totalSpinsEarned = user.purchases.reduce((sum, p) => sum + p.spins_earned, 0);
    const totalSpinsUsed = user.spin_sessions.reduce((sum, s) => sum + s.spins_used, 0);
    
    // Группируем выигранные призы по ID приза для правильного подсчета дубликатов
    const wonPrizes = user.spin_results.reduce((acc, result) => {
      const prizeId = result.prize.id;
      const prizeName = result.prize.name;
      if (!acc[prizeId]) {
        acc[prizeId] = {
          id: prizeId,
          name: prizeName,
          type: result.prize.type,
          count: 0
        };
      }
      acc[prizeId].count++;
      return acc;
    }, {} as Record<number, { id: number; name: string; type: string; count: number }>);

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      totalPurchaseAmount,
      totalSpinsEarned,
      totalSpinsUsed,
      spinsRemaining: totalSpinsEarned - totalSpinsUsed,
      wonPrizes: Object.values(wonPrizes),
      purchasesCount: user.purchases.length,
      sessionsCount: user.spin_sessions.length
    };
  }

  /**
   * Создать нового пользователя
   */
  async createUser(data: {
    email: string;
    phone?: string;
    purchaseAmount?: number;
    spinsCount?: number;
  }) {
    const { email, purchaseAmount = 0, spinsCount = 0 } = data;

    // Проверяем, что пользователь с такой почтой не существует
    const existingUser = await this.prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new BadRequestException('Пользователь с такой почтой уже существует');
    }

    // Создаем пользователя
    const user = await this.prisma.users.create({
      data: { 
        email
      }
    });

    // Если указана сумма покупки или количество прокруток, создаем покупку
    if (purchaseAmount > 0 || spinsCount > 0) {
      const purchase = await this.prisma.purchases.create({
        data: {
          user_id: user.id,
          amount: purchaseAmount,
          spins_earned: spinsCount,
          customer_email: email,
          name: "Не указано",
          phone: "Не указано",
          products: ["Покупка создана вручную."]
        }
      });

      // Создаем сессию прокруток
      if (spinsCount > 0) {
        await this.prisma.spin_sessions.create({
          data: {
            user_id: user.id,
            purchase_id: purchase.id,
            spins_total: spinsCount,
            spins_used: 0
          }
        });
      }
    }

    return user;
  }

  /**
   * Обновить данные пользователя
   */
  async updateUser(userId: number, data: {
    email?: string;
    purchaseAmount?: number;
    spinsCount?: number;
  }) {
    const { email, purchaseAmount, spinsCount } = data;

    // Проверяем существование пользователя
    const user = await this.prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Если меняется email, проверяем уникальность
    if (email && email !== user.email) {
      const existingUser = await this.prisma.users.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new BadRequestException('Пользователь с такой почтой уже существует');
      }
    }

    // Обновляем email пользователя
    if (email) {
      await this.prisma.users.update({
        where: { id: userId },
        data: { email }
      });
    }

    // Обновляем данные покупки, если указаны
    if (purchaseAmount !== undefined || spinsCount !== undefined) {
      const purchase = await this.prisma.purchases.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      });

      if (purchase) {
        await this.prisma.purchases.update({
          where: { id: purchase.id },
          data: {
            amount: purchaseAmount !== undefined ? purchaseAmount : purchase.amount,
            spins_earned: spinsCount !== undefined ? spinsCount : purchase.spins_earned
          }
        });

        // Обновляем сессию прокруток
        const session = await this.prisma.spin_sessions.findFirst({
          where: { purchase_id: purchase.id }
        });

        if (session && spinsCount !== undefined) {
          await this.prisma.spin_sessions.update({
            where: { id: session.id },
            data: { spins_total: spinsCount, is_active: true }

          });
        }
      }
    }

    return { message: 'Пользователь успешно обновлен' };
  }

  // ========== УПРАВЛЕНИЕ ПРИЗАМИ ==========

  /**
   * Получить список всех призов
   */
  async getPrizes() {
    return await this.prisma.prizes.findMany({
      orderBy: { number: 'asc' }
    });
  }

  /**
   * Создать новый приз
   */
  async createPrize(data: {
    name: string;
    total_quantity: number;
    quantity_remaining: number;
    type?: string;
    image?: string;
    from_color?: string;
    to_color?: string;
    between_color?: string;
    text_color?: string;
    number: number;
  }) {
    return await this.prisma.prizes.create({
      data
    });
  }

  /**
   * Обновить приз
   */
  async updatePrize(prizeId: number, data: {
    name?: string;
    total_quantity?: number;
    quantity_remaining?: number;
    type?: string;
    image?: string;
    from_color?: string;
    to_color?: string;
    between_color?: string;
    text_color?: string;
    number?: number;
  }) {
    const prize = await this.prisma.prizes.findUnique({
      where: { id: prizeId }
    });

    if (!prize) {
      throw new NotFoundException('Приз не найден');
    }

    return await this.prisma.prizes.update({
      where: { id: prizeId },
      data
    });
  }

  /**
   * Удалить приз
   */
  async deletePrize(prizeId: number) {
    const prize = await this.prisma.prizes.findUnique({
      where: { id: prizeId }
    });

    if (!prize) {
      throw new NotFoundException('Приз не найден');
    }

    // Проверяем, есть ли связанные записи
    const spinResults = await this.prisma.spin_results.count({
      where: { prize_id: prizeId }
    });

    const mandatoryPrizes = await this.prisma.mandatory_prizes.count({
      where: { prize_id: prizeId }
    });

    if (spinResults > 0 || mandatoryPrizes > 0) {
      throw new BadRequestException('Нельзя удалить приз, который уже использовался в системе');
    }

    await this.prisma.prizes.delete({
      where: { id: prizeId }
    });

    return { message: 'Приз успешно удален' };
  }



  /**
   * Обновить количество выпадений приза
   */
  async updatePrizeQuantity(prizeId: number, quantity: number, type: string) {
    const prize = await this.prisma.prizes.findUnique({
      where: { id: prizeId }
    });

    if (!prize) {
      throw new NotFoundException('Приз не найден');
    }

    return await this.prisma.prizes.update({
      where: { id: prizeId },
      data: { quantity_remaining: quantity, type: type }
    });
  }

  // ========== УПРАВЛЕНИЕ ОБЯЗАТЕЛЬНЫМИ ПРИЗАМИ ==========

  /**
   * Получить список всех обязательных призов
   */
  async getMandatoryPrizes() {
    return await this.prisma.mandatory_prizes.findMany({
      include: {
        prize: {
          select: {
            id: true,
            name: true,
            type: true,
            image: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Создать новый обязательный приз
   */
  async createMandatoryPrize(data: {
    prize_id: number;
    target_quantity: number;
    period_start: Date;
    period_end: Date;
  }) {
    // Проверяем существование приза
    const prize = await this.prisma.prizes.findUnique({
      where: { id: data.prize_id }
    });

    if (!prize) {
      throw new NotFoundException('Приз не найден');
    }

    return await this.prisma.mandatory_prizes.create({
      data: {
        ...data,
        issued_quantity: 0,
        is_active: true
      }
    });
  }

  /**
   * Обновить обязательный приз
   */
  async updateMandatoryPrize(mandatoryPrizeId: number, data: {
    prize_id?: number;
    target_quantity?: number;
    period_start?: Date;
    period_end?: Date;
    is_active?: boolean;
  }) {
    const mandatoryPrize = await this.prisma.mandatory_prizes.findUnique({
      where: { id: mandatoryPrizeId }
    });

    if (!mandatoryPrize) {
      throw new NotFoundException('Обязательный приз не найден');
    }

    // Если меняется приз, проверяем его существование
    if (data.prize_id) {
      const prize = await this.prisma.prizes.findUnique({
        where: { id: data.prize_id }
      });

      if (!prize) {
        throw new NotFoundException('Приз не найден');
      }
    }

    return await this.prisma.mandatory_prizes.update({
      where: { id: mandatoryPrizeId },
      data
    });
  }

  /**
   * Удалить обязательный приз
   */
  async deleteMandatoryPrize(mandatoryPrizeId: number) {
    const mandatoryPrize = await this.prisma.mandatory_prizes.findUnique({
      where: { id: mandatoryPrizeId }
    });

    if (!mandatoryPrize) {
      throw new NotFoundException('Обязательный приз не найден');
    }

    await this.prisma.mandatory_prizes.delete({
      where: { id: mandatoryPrizeId }
    });

    return { message: 'Обязательный приз успешно удален' };
  }

  // ========== ЭКСПОРТ ДАННЫХ ==========

  /**
   * Получить данные о покупках для экспорта в Excel
   */
  async getPurchasesData() {
    const purchases = await this.prisma.purchases.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return purchases.map(purchase => ({
      name: purchase.name || 'Не указано',
      phone: purchase.phone || 'Не указан', 
      email: purchase.user?.email || purchase.customer_email || 'Не указан',
      product: Array.isArray(purchase.products) ? purchase.products.join(', ') : 'Не указано',
      amount: purchase.amount,
      spinsEarned: purchase.spins_earned,
      createdAt: purchase.created_at
    }));
  }

  /**
   * Получить данные о прокрутках для экспорта в Excel
   */
  async getSpinsData() {
    const users = await this.prisma.users.findMany({
      include: {
        purchases: {
          select: {
            amount: true,
            spins_earned: true,
            name: true,
            phone: true,
            products: true
          }
        },
        spin_sessions: {
          select: {
            spins_total: true,
            spins_used: true
          }
        },
        spin_results: {
          include: {
            prize: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return users.map(user => {
      const totalPurchaseAmount = user.purchases.reduce((sum, p) => sum + p.amount, 0);
      const totalSpinsEarned = user.purchases.reduce((sum, p) => sum + p.spins_earned, 0);
      const totalSpinsUsed = user.spin_sessions.reduce((sum, s) => sum + s.spins_used, 0);
      const spinsRemaining = totalSpinsEarned - totalSpinsUsed;

      // Берем данные из последней покупки
      const lastPurchase = user.purchases[0];
      const name = lastPurchase?.name || 'Не указано';
      const phone = lastPurchase?.phone || 'Не указан';
      const products = lastPurchase?.products ? 
        (Array.isArray(lastPurchase.products) ? lastPurchase.products.join(', ') : lastPurchase.products) : 
        'Не указано';

      // Группируем выигранные призы
      const wonPrizes = user.spin_results.reduce((acc, result) => {
        const prizeName = result.prize.name;
        if (!acc[prizeName]) {
          acc[prizeName] = 0;
        }
        acc[prizeName]++;
        return acc;
      }, {} as Record<string, number>);

      // Формируем строку с призами
      const prizesString = Object.entries(wonPrizes)
        .map(([name, count]) => `${name} (${count})`)
        .join(', ');

      return {
        name,
        phone,
        email: user.email,
        purchaseAmount: totalPurchaseAmount,
        totalSpins: totalSpinsEarned,
        spinsRemaining: spinsRemaining,
        wonPrizes: prizesString || 'Нет выигранных призов',
        products: products,
        createdAt: user.created_at
      };
    });
  }

  /**
   * Экспортировать данные о покупках в Excel
   */
  async exportPurchasesToExcel() {
    const data = await this.getPurchasesData();
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Покупки');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Экспортировать данные о прокрутках в Excel
   */
  async exportSpinsToExcel() {
    const data = await this.getSpinsData();
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Прокрутки');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}
