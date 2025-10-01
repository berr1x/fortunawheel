import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

/**
 * Сервис для работы с базой данных PostgreSQL через Prisma ORM
 * Предоставляет типизированный доступ ко всем таблицам БД
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  /**
   * Инициализация подключения к базе данных
   * Вызывается автоматически при запуске модуля
   */
  async onModuleInit() {
    // Устанавливаем соединение с PostgreSQL
    await this.$connect();
  }
}