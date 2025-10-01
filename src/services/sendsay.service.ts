import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Сервис для отправки email через Sendsay API
 * Интегрируется с сервисом рассылок Sendsay для отправки уведомлений
 */
@Injectable()
export class SendsayService {
  private apiUrl = 'https://api.sendsay.ru/api/v1/json/';

  constructor(private configService: ConfigService) {}

  /**
   * Отправка email через Sendsay API
   * 
   * @param to - Email получателя
   * @param subject - Тема письма
   * @param body - Текст письма
   * @returns Результат отправки (успех/ошибка)
   */
  async sendEmail(to: string, subject: string, body: string) {
    // TODO: Реализовать интеграцию с Sendsay API
    const login = this.configService.get('SENDSAY_LOGIN');
    const password = this.configService.get('SENDSAY_PASSWORD');
    const subaccount = this.configService.get('SENDSAY_SUBACCOUNT');

    try {
      // TODO: Аутентификация и отправка email
      // 1. Получить токен аутентификации
      // 2. Сформировать запрос на отправку
      // 3. Отправить письмо через API
      console.log('Sending email via Sendsay:', { to, subject });
      return { success: true };
    } catch (error) {
      console.error('Sendsay error:', error);
      return { success: false, error: error.message };
    }
  }
}