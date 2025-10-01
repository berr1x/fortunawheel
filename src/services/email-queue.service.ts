import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Сервис для управления очередью email
 * Добавляет задачи в очередь и обрабатывает их с задержкой
 */
@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  /**
   * Добавление задачи отправки email в очередь с задержкой
   * 
   * @param userId - ID пользователя
   * @param spinResultId - ID результата прокрутки колеса
   * @param delay - Задержка в миллисекундах (по умолчанию 5 минут)
   */
  async addEmailJob(userId: number, spinResultId: number, delay: number = 5 * 60 * 1000) {
    // TODO: Добавить задачу email в очередь с задержкой
    await this.emailQueue.add(
      'send-email',
      { userId, spinResultId },
      { delay }
    );
  }

  /**
   * Обработка задачи отправки email
   * Вызывается процессором когда приходит время отправки
   * 
   * @param job - Задача из очереди с данными для отправки
   */
  async processEmailJob(job: any) {
    // TODO: Обработать задачу email - отправить через Sendsay API
    // 1. Получить данные пользователя и результата прокрутки
    // 2. Сформировать текст письма
    // 3. Отправить через SendsayService
    // 4. Обновить статус в БД
    console.log('Processing email job:', job.data);
  }
}