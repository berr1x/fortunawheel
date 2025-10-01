import { Process, Processor } from '@nestjs/bull';
import { EmailQueueService } from '../services/email-queue.service';
import { SendsayService } from '../services/sendsay.service';

/**
 * Процессор для обработки задач из очереди email
 * Обрабатывает задачи отправки email с задержкой
 */
@Processor('email')
export class EmailProcessor {
  constructor(
    private emailQueueService: EmailQueueService,
    private sendsayService: SendsayService,
  ) {}

  /**
   * Обработчик задач отправки email
   * Вызывается автоматически когда задача готова к выполнению
   * 
   * @param job - Задача из очереди с данными для отправки
   */
  @Process('send-email')
  async handleEmail(job: any) {
    // Передаем задачу в сервис для обработки
    await this.emailQueueService.processEmailJob(job);
  }
}