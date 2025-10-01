import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Сервис для работы с Redis кешем
 * Предоставляет методы для кеширования данных и управления сессиями
 */
@Injectable()
export class RedisService implements OnModuleInit {
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  /**
   * Инициализация подключения к Redis
   * Вызывается автоматически при запуске модуля
   */
  async onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  /**
   * Получение клиента Redis для прямого доступа
   * 
   * @returns Экземпляр Redis клиента
   */
  getClient(): Redis {
    return this.redis;
  }

  /**
   * Сохранение значения в Redis с опциональным TTL
   * 
   * @param key - Ключ для сохранения
   * @param value - Значение для сохранения
   * @param ttl - Время жизни в секундах (опционально)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      // Сохраняем с временем жизни
      await this.redis.setex(key, ttl, value);
    } else {
      // Сохраняем без времени жизни
      await this.redis.set(key, value);
    }
  }

  /**
   * Получение значения из Redis
   * 
   * @param key - Ключ для получения
   * @returns Значение или null если не найдено
   */
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  /**
   * Удаление значения из Redis
   * 
   * @param key - Ключ для удаления
   */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}