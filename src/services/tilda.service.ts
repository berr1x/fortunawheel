import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import axios from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Сервис для интеграции с Tilda
 * Обрабатывает webhook'и о покупках и создает соответствующие записи в БД
 */
@Injectable()
export class TildaService {
  private readonly logger = new Logger(TildaService.name);
  private readonly SENDSAY_API_URL = 'https://api.sendsay.ru/general/api/v100/json/cakeschool';

  // HTML содержимое письма (загружается из файла)
  private readonly WHEEL_EMAIL_HTML: string;

  constructor(private prisma: PrismaService) {
    // Загружаем HTML шаблон из файла при инициализации
    try {
      const templatePath = join(__dirname, '..', 'mails', 'registration.html');
      this.WHEEL_EMAIL_HTML = readFileSync(templatePath, 'utf-8');
      this.logger.log('Registration email template loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load registration email template:', error);
      throw new Error('Failed to load registration email template');
    }
  }

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
      const { Name, Email, Phone, payment } = webhookData;

      if (!Email || !payment || !payment.amount || !payment.orderid || !Name) {
        return {
          success: false,
          message: 'Invalid webhook data',
        };
      }

      // Извлекаем список продуктов (только названия)
      const products = payment.products ? payment.products.map((product: any) => product.name) : [];

      // Рассчитываем количество прокруток (каждые 50 рублей = 1 прокрутка)
      const spinsEarned = this.calculateSpins(Number(payment.amount));

      this.logger.log(`Processing purchase: email=${Email}, phone=${Phone}, amount=${payment.amount}, spins=${spinsEarned}, products=${JSON.stringify(products)}`);

      return await this.prisma.$transaction(async (tx) => {
        // 1. Создать или найти пользователя по email
        const user = await this.findOrCreateUser(tx, Email);

        // 2. Создать запись о покупке
        const purchase = await this.createPurchase(tx, user.id, {
          order_id: payment.orderid,
          amount: Number(payment.amount),
          spins_earned: spinsEarned,
          customer_email: Email,
          phone: Phone,
          products: products,
          name: Name
        });

        // 3. Создать сессию прокруток только если есть прокрутки
        let session = null;
        if (spinsEarned > 0) {
          session = await this.createSpinSession(tx, user.id, purchase.id, spinsEarned);
          this.logger.log(`Successfully created session ${session.id} with ${spinsEarned} spins for user ${Email}`);
          
          // 4. Отправить письмо с колесом фортуны, если есть прокрутки
          try {
            await this.sendWheelEmail(Email);
            this.logger.log(`Wheel email sent successfully to ${Email}`);
          } catch (emailError) {
            this.logger.error(`Failed to send wheel email to ${Email}:`, emailError);
            // Не прерываем выполнение, если не удалось отправить письмо
          }
        } else {
          this.logger.warn(`No spins earned for amount ${payment.amount}, skipping session creation and email sending`);
        }

        return {
          success: true,
          message: spinsEarned > 0 ? 'Purchase processed successfully' : 'Purchase processed but no spins earned',
          sessionId: session?.id || null,
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

    const { Email, Phone, payment } = data;

    if (!Email || typeof Email !== 'string') {
      throw new BadRequestException('Valid email is required');
    }

    // Phone не обязателен, но если есть - должен быть строкой
    if (Phone && typeof Phone !== 'string') {
      throw new BadRequestException('Phone must be a string if provided');
    }

    if (!payment || typeof Number(payment.amount) !== 'number' || Number(payment.amount) <= 0) {
      throw new BadRequestException('Valid amount is required');
    }

    if (!payment.orderid || typeof payment.orderid !== 'string') {
      throw new BadRequestException('Valid order_id is required');
    }

    // Проверяем products, если они есть
    if (payment.products && !Array.isArray(payment.products)) {
      throw new BadRequestException('Products must be an array if provided');
    }

    return { Email: Email, Phone: Phone, payment: payment };
  }

  /**
   * Расчет количества прокруток на основе суммы покупки
   * Каждые 50 рублей = 1 прокрутка
   * 
   * @param amount - Сумма покупки в рублях
   * @returns Количество прокруток
   */
  private calculateSpins(amount: number): number {
    return Math.floor(amount / 50); // 50 рублей за прокрутку
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
      // Создаем нового пользователя
      user = await tx.users.create({
        data: { 
          email
        },
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
        phone: orderData.phone,
        products: orderData.products,
        name: orderData.name,
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

  /**
   * Отправка письма с колесом фортуны через Sendsay API
   * 
   * @param email - Email получателя
   * @returns Результат отправки письма
   */
  private async sendWheelEmail(email: string) {
    try {
      const requestData = {
        action: 'issue.send',
        letter: {
          message: {
            html: this.WHEEL_EMAIL_HTML
          },
          subject: 'Колесо фортуны',
          'from.email': 'mail@info.cake-school.com',
          'from.name': 'Колесо фортуны'
        },
        group: 'personal',
        email: email,
        sendwhen: 'now'
      };

      const response = await axios.post(this.SENDSAY_API_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sendsay apikey=19mD7PhStSbesR1odSpR24Khd3-t_k0_-wkURlnXjWMrRitejwbu4staPSK-i5JKYjRwR6Opr',
        },
        timeout: 10000, // 10 секунд таймаут
      });

      this.logger.log(`Sendsay API response for ${email}:`, response.data);
      return response.data;
    } catch (error) {
      this.logger.error(`Error sending email to ${email}:`, error.response?.data || error.message);
      throw error;
    }
  }
}