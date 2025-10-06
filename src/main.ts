import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

/**
 * Главная функция запуска приложения
 * Настраивает NestJS приложение, Swagger документацию и запускает сервер
 */
async function bootstrap() {
	// Создаем экземпляр NestJS приложения с поддержкой Express
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	
	// Устанавливаем глобальный префикс для всех API маршрутов
	app.setGlobalPrefix('api');
	
	// Настраиваем CORS для работы с фронтендом
	app.enableCors({
		origin: true, // Разрешаем все домены в разработке
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
		credentials: true
	});

	// Настраиваем глобальную валидацию входящих данных
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

	// Настраиваем статическую раздачу файлов из папки uploads
	app.useStaticAssets(join(__dirname, '..', 'uploads'), {
		prefix: '/uploads/',
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
	
	// Запускаем сервер на указанном порту
	await app.listen(port);
	console.log(`Server started on http://localhost:${port}`);
}

bootstrap();