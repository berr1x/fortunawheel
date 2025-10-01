import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { MandatoryPrizesService } from '../../services/mandatory-prizes.service';

@ApiTags('mandatory-prizes')
@Controller('mandatory-prizes')
export class MandatoryPrizesController {
  constructor(private mandatoryPrizesService: MandatoryPrizesService) {}

  /**
   * Получение активных обязательных подарков
   * 
   * @returns Список активных обязательных подарков
   */
  @ApiOperation({ summary: 'Get active mandatory prizes' })
  @Get('active')
  async getActiveMandatoryPrizes() {
    return await this.mandatoryPrizesService.getActiveMandatoryPrizes();
  }

  /**
   * Получение приоритетных обязательных подарков
   * 
   * @returns Список приоритетных обязательных подарков для выдачи
   */
  @ApiOperation({ summary: 'Get priority mandatory prizes' })
  @Get('priority')
  async getPriorityMandatoryPrizes() {
    return await this.mandatoryPrizesService.getPriorityMandatoryPrizes();
  }

  /**
   * Создание обязательного подарка
   * 
   * @param body - Данные для создания обязательного подарка
   * @returns Созданный обязательный подарок
   */
  @ApiOperation({ summary: 'Create mandatory prize' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prizeId: { type: 'number', description: 'ID приза' },
        targetQuantity: { type: 'number', description: 'Целевое количество для выдачи за 24 часа' }
      },
      required: ['prizeId', 'targetQuantity']
    }
  })
  @Post()
  async createMandatoryPrize(@Body() body: { prizeId: number; targetQuantity: number }) {
    if (!body.prizeId || !body.targetQuantity) {
      throw new BadRequestException('prizeId и targetQuantity обязательны');
    }

    if (body.targetQuantity <= 0) {
      throw new BadRequestException('targetQuantity должно быть больше 0');
    }

    return await this.mandatoryPrizesService.createMandatoryPrize(body.prizeId, body.targetQuantity);
  }

  /**
   * Создание ежедневных обязательных подарков
   * 
   * @returns Результат создания ежедневных подарков
   */
  @ApiOperation({ summary: 'Create daily mandatory prizes' })
  @Post('daily')
  async createDailyMandatoryPrizes() {
    await this.mandatoryPrizesService.createDailyMandatoryPrizes();
    return { message: 'Ежедневные обязательные подарки созданы успешно' };
  }

  /**
   * Деактивация завершенных периодов
   * 
   * @returns Количество деактивированных записей
   */
  @ApiOperation({ summary: 'Deactivate expired periods' })
  @Post('deactivate-expired')
  async deactivateExpiredPeriods() {
    const count = await this.mandatoryPrizesService.deactivateExpiredPeriods();
    return { message: `Деактивировано ${count} завершенных периодов` };
  }
}