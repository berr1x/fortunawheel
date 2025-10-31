import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import compression from 'compression';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

/**
 * Главная функция запуска приложения
 * Настраивает NestJS приложение, Swagger документацию и запускает сервер
 */
async function bootstrap() {
	// Создаем экземпляр NestJS приложения с поддержкой Express
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	
	// Устанавливаем глобальный префикс для всех API маршрутов
	app.setGlobalPrefix('api');

	// Оптимизация производительности и сетевых параметров
	// 1) Безопасные заголовки
	app.use(helmet({ crossOriginResourcePolicy: false }));
	// 2) Сжатие ответов (gzip/deflate/br при поддержке клиента)
	app.use(compression({ level: 6 }));
	// 3) Лимиты на размер тела запросов
	app.use(json({ limit: '1mb' }));
	app.use(urlencoded({ extended: true, limit: '1mb' }));
	// 4) Trust proxy для корректной работы за Nginx/Ingress
	app.getHttpAdapter().getInstance().set('trust proxy', 1);
	// 5) Включаем сильные ETag для 304
	app.getHttpAdapter().getInstance().set('etag', 'strong');
	
	// Настраиваем CORS для работы с фронтендом
	app.enableCors({
		origin: true, // Разрешаем все домены в разработке
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
		credentials: true
	});

	// Настраиваем глобальную валидацию входящих данных
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

	// Настраиваем статическую раздачу файлов из папки uploads (добавляем кэширование)
	app.useStaticAssets(join(__dirname, '..', 'uploads'), {
		prefix: '/uploads/',
		maxAge: '30d',
		immutable: true,
	});

	// Настраиваем Swagger документацию
	const config = new DocumentBuilder()
		.setTitle('Fortuna API')
		.setDescription('API для системы колеса фортуны с интеграцией Tilda и Sendsay')
		.setVersion('1.0')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document);

	// Получаем порт из переменных окружения или используем 3000 по умолчанию
	const port = process.env.PORT ? Number(process.env.PORT) : 3000;
	
	// Тюнинг таймаутов HTTP сервера для keep-alive под высокой нагрузкой
	const server = app.getHttpServer() as any;
	if (server) {
		// Время ожидания коннекта keep-alive
		server.keepAliveTimeout = 65_000; // ms
		// Должно быть больше keepAliveTimeout
		server.headersTimeout = 66_000; // ms
		// Отключаем общий request timeout у Node (даем возможность управлять на уровне Nginx)
		server.requestTimeout = 0;
	}

	// Запускаем сервер на указанном порту
	await app.listen(port);
	console.log(`Server started on http://localhost:${port}`);
}

bootstrap();