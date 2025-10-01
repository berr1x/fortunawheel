import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
// import { AdminModule } from '@adminjs/nestjs';
import { TildaModule } from './modules/tilda/tilda.module';
import { WheelModule } from './modules/wheel/wheel.module';
import { PrismaService } from './services/prisma.service';
import { RedisService } from './services/redis.service';
import { EmailQueueService } from './services/email-queue.service';
import { SendsayService } from './services/sendsay.service';
import { EmailProcessor } from './processors/email.processor';
// import { createAdminConfig } from './config/admin.config';

/**
 * Главный модуль приложения
 * Объединяет все модули, сервисы и настройки приложения
 */
@Module({
	imports: [
		// Глобальный модуль конфигурации для работы с переменными окружения
		ConfigModule.forRoot({ isGlobal: true }),
		
		// Настройка Bull Queue для работы с очередями задач
		BullModule.forRoot({
			redis: {
				host: process.env.REDIS_HOST || 'localhost',
				port: parseInt(process.env.REDIS_PORT) || 6379,
				password: process.env.REDIS_PASSWORD,
			},
		}),
		
		// Регистрация очереди для отправки email
		BullModule.registerQueue({
			name: 'email',
		}),
		
		// Закомментированная админка (AdminJS) - можно раскомментировать при необходимости
		// AdminModule.createAdminAsync({
		// 	useFactory: (prismaService: PrismaService, configService) => 
		// 		createAdminConfig(prismaService, configService),
		// 	inject: [PrismaService, ConfigModule],
		// }),
		
		// Модуль для интеграции с Tilda (webhook для покупок)
		TildaModule,
		
		// Модуль для работы с колесом фортуны
		WheelModule,
	],
	
	// Провайдеры - сервисы, доступные во всем приложении
	providers: [
		PrismaService,        // Сервис для работы с базой данных PostgreSQL
		RedisService,         // Сервис для работы с Redis кешем
		EmailQueueService,    // Сервис для управления очередью email
		SendsayService,       // Сервис для отправки email через Sendsay API
		EmailProcessor,       // Процессор для обработки задач из очереди email
	],
})
export class AppModule {}