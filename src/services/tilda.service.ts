import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Сервис для интеграции с Tilda
 * Обрабатывает webhook'и о покупках и создает соответствующие записи в БД
 */
@Injectable()
export class TildaService {
  private readonly logger = new Logger(TildaService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Основной метод обработки покупки от Tilda
   * Создает пользователя, запись о покупке и сессию прокруток
   * 
   * @param webhookData - Данные webhook'а от Tilda
   * @returns Результат обработки покупки
   */
  async processPurchase(webhookData: any) {
    try {
      // Валидация входящих данных
      const { Email, payment } = this.validateWebhookData(webhookData);

      // Рассчитываем количество прокруток (каждые 3000 рублей = 1 прокрутка)
      const spinsEarned = this.calculateSpins(Number(payment.amount));

      this.logger.log(`Processing purchase: email=${Email}, amount=${payment.amount}, spins=${spinsEarned}`);

      // Если прокруток нет, не создаем сессию
      if (spinsEarned === 0) {
        this.logger.warn(`No spins earned for amount ${payment.amount}, skipping session creation`);
        return { 
          success: true, 
          message: 'Purchase processed but no spins earned',
          spinsEarned: 0 
        };
      }

      return await this.prisma.$transaction(async (tx) => {
        // 1. Создать или найти пользователя по email
        const user = await this.findOrCreateUser(tx, Email);

        // 2. Создать запись о покупке
        const purchase = await this.createPurchase(tx, user.id, {
          order_id: payment.orderid,
          amount: Number(payment.amount),
          spins_earned: spinsEarned,
          customer_email: Email,
        });

        // 3. Создать сессию прокруток
        const session = await this.createSpinSession(tx, user.id, purchase.id, spinsEarned);

        this.logger.log(`Successfully created session ${session.id} with ${spinsEarned} spins for user ${Email}`);

        return {
          success: true,
          message: 'Purchase processed successfully',
          sessionId: session.id,
          spinsEarned,
          userId: user.id,
        };
      });
    } catch (error) {
      this.logger.error('Error processing purchase:', error);
      throw new BadRequestException('Failed to process purchase');
    }
  }

  /**
   * Валидация данных webhook'а от Tilda
   * 
   * @param data - Данные webhook'а
   * @returns Валидированные данные
   */
  private validateWebhookData(data: any) {
    if (!data) {
      throw new BadRequestException('Webhook data is required');
    }

    const { Email, payment } = data;

    if (!Email || typeof Email !== 'string') {
      throw new BadRequestException('Valid email is required');
    }

    if (!payment || typeof Number(payment.amount) !== 'number' || Number(payment.amount) <= 0) {
      throw new BadRequestException('Valid amount is required');
    }

    if (!payment.orderid || typeof payment.orderid !== 'string') {
      throw new BadRequestException('Valid order_id is required');
    }

    return { Email: Email, payment: payment };
  }

  /**
   * Расчет количества прокруток на основе суммы покупки
   * Каждые 3000 рублей = 1 прокрутка
   * 
   * @param amount - Сумма покупки в рублях
   * @returns Количество прокруток
   */
  private calculateSpins(amount: number): number {
    return Math.floor(amount / 3000);
  }

  /**
   * Поиск или создание пользователя
   * 
   * @param tx - Транзакция Prisma
   * @param email - Email пользователя
   * @returns Данные пользователя
   */
  private async findOrCreateUser(tx: any, email: string) {
    let user = await tx.users.findUnique({
      where: { email },
    });

    if (!user) {
      user = await tx.users.create({
        data: { email },
      });
      this.logger.log(`Created new user: ${email}`);
    }

    return user;
  }

  /**
   * Создание записи о покупке
   * 
   * @param tx - Транзакция Prisma
   * @param userId - ID пользователя
   * @param orderData - Данные заказа
   * @returns Данные созданной покупки
   */
  private async createPurchase(tx: any, userId: number, orderData: any) {
    return await tx.purchases.create({
      data: {
        user_id: userId,
        order_id: orderData.order_id,
        amount: orderData.amount,
        spins_earned: orderData.spins_earned,
        customer_email: orderData.customer_email,
        data: orderData, // Сохраняем полные данные заказа
      },
    });
  }

  /**
   * Создание сессии прокруток
   * 
   * @param tx - Транзакция Prisma
   * @param userId - ID пользователя
   * @param purchaseId - ID покупки
   * @param spinsTotal - Общее количество прокруток
   * @returns Данные созданной сессии
   */
  private async createSpinSession(tx: any, userId: number, purchaseId: number, spinsTotal: number) {
    return await tx.spin_sessions.create({
      data: {
        user_id: userId,
        purchase_id: purchaseId,
        spins_total: spinsTotal,
        spins_used: 0,
        is_active: true,
      },
    });
  }
}