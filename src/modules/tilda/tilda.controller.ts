import { Controller, Post, Body, Headers, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TildaService } from '../../services/tilda.service';

/**
 * Контроллер для интеграции с Tilda
 * Обрабатывает webhook'и от Tilda о новых покупках
 */
@ApiTags('tilda')
@Controller('tilda')
export class TildaController {
	private readonly logger = new Logger(TildaController.name);

	constructor(private tildaService: TildaService) {}

	/**
	 * Webhook endpoint для получения уведомлений о покупках от Tilda
	 * 
	 * @param body - Данные о покупке от Tilda (сумма, email, order_id и т.д.)
	 * @param headers - HTTP заголовки запроса
	 * @returns Результат обработки покупки
	 */
	@ApiOperation({ summary: 'Webhook from Tilda about new purchase' })
	@ApiResponse({ status: 200, description: 'Purchase processed successfully' })
	@ApiResponse({ status: 400, description: 'Invalid webhook data' })
	@ApiResponse({ status: 500, description: 'Internal server error' })
	@Post('webhook')
	async webhook(@Body() body: any, @Headers() headers: Record<string, string>) {
		try {
			this.logger.log('Received Tilda webhook', { body, headers });
			
			// Передаем данные о покупке в сервис для обработки
			const result = await this.tildaService.processPurchase(body);
			
			this.logger.log('Webhook processed successfully', result);
			return result;
		} catch (error) {
			this.logger.error('Error processing Tilda webhook:', error);
			
			// Возвращаем ошибку в формате, понятном для Tilda
			throw new HttpException(
				{
					success: false,
					message: error.message || 'Internal server error',
					error: 'WEBHOOK_PROCESSING_ERROR'
				},
				error.status || HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
}