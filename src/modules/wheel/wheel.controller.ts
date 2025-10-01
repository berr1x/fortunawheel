import { Controller, Get, Post, Query, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery, ApiBody } from '@nestjs/swagger';
import { WheelService, SpinResult } from '../../services/wheel.service';

/**
 * Контроллер для работы с колесом фортуны
 * Предоставляет API для создания сессий и прокрутки колеса
 */
@ApiTags('wheel')
@Controller('wheel')
export class WheelController {
	constructor(private wheelService: WheelService) {}

	/**
	 * Создание или получение сессии прокруток по email
	 * 
	 * @param email - Email пользователя
	 * @returns Данные сессии (ID сессии и количество оставшихся прокруток)
	 */
	@ApiOperation({ summary: 'Create or get session by email' })
	@ApiQuery({ name: 'email', description: 'User email address', example: 'user@example.com' })
	@Get('session')
	async getSession(@Query('email') email: string) {
		if (!email || !email.includes('@')) {
			throw new BadRequestException('Некорректный email адрес');
		}
		
		try {
			// Создаем или получаем существующую сессию для пользователя
			const session = await this.wheelService.createOrGetSession(email);
			return {
				success: true,
				...session
			};
		} catch (error) {
			// Если пользователь не найден или нет покупок
			if (error instanceof NotFoundException) {
				return {
					success: false,
					message: error.message,
					sessionId: null,
					spinsRemaining: 0
				};
			}
			// Пробрасываем другие ошибки
			throw error;
		}
	}

	/**
	 * Прокрутка колеса фортуны
	 * 
	 * @param sessionId - ID сессии прокруток
	 * @returns Результат прокрутки (выигранный приз и статус)
	 */
	@ApiOperation({ summary: 'Spin the wheel' })
	@ApiBody({ 
		schema: { 
			type: 'object', 
			properties: { 
				sessionId: { type: 'string', description: 'Session ID for spinning' } 
			},
			required: ['sessionId']
		} 
	})
	@Post('spin')
	async spin(@Body('sessionId') sessionId: string): Promise<SpinResult> {
		if (!sessionId) {
			throw new BadRequestException('Session ID is required');
		}
		
		// Выполняем прокрутку колеса и определяем приз
		const result = await this.wheelService.spinWheel(sessionId);
		return result;
	}

	/**
	 * Получение списка доступных призов
	 * 
	 * @returns Список доступных призов
	 */
	@ApiOperation({ summary: 'Get available prizes' })
	@Get('prizes')
	async getPrizes(): Promise<any[]> {
		// Получаем список доступных призов
		const prizes = await this.wheelService.getAvailablePrizes();
		return prizes;
	}

	/**
	 * Получение всех выигранных призов пользователя
	 * 
	 * @param email - Email пользователя
	 * @returns Список выигранных призов с деталями
	 */
	@ApiOperation({ summary: 'Get user won prizes' })
	@ApiQuery({ name: 'email', description: 'User email address', example: 'user@example.com' })
	@Get('won-prizes')
	async getWonPrizes(@Query('email') email: string) {
		if (!email || !email.includes('@')) {
			throw new BadRequestException('Некорректный email адрес');
		}
		
		try {
			// Получаем все выигранные призы пользователя
			const wonPrizes = await this.wheelService.getUserWonPrizes(email);
			return {
				success: true,
				prizes: wonPrizes,
				totalCount: wonPrizes.length
			};
		} catch (error) {
			// Если пользователь не найден
			if (error instanceof NotFoundException) {
				return {
					success: false,
					message: error.message,
					prizes: [],
					totalCount: 0
				};
			}
			// Пробрасываем другие ошибки
			throw error;
		}
	}
}