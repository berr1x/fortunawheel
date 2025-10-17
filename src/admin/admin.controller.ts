import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';

/**
 * Контроллер админки для управления пользователями, призами и обязательными призами
 */
@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========

  @Get('users')
  @ApiOperation({ summary: 'Получить список всех пользователей' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по email' })
  @ApiResponse({ status: 200, description: 'Список пользователей получен успешно' })
  async getUsers(@Query('search') search?: string) {
    return await this.adminService.getUsers(search);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Получить данные пользователя по ID' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Данные пользователя получены успешно' })
  async getUserById(@Param('id') userId: string) {
    return await this.adminService.getUserById(parseInt(userId));
  }

  @Post('users')
  @ApiOperation({ summary: 'Создать нового пользователя' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email пользователя' },
        purchaseAmount: { type: 'number', description: 'Сумма покупки' },
        spinsCount: { type: 'number', description: 'Количество прокруток' }
      },
      required: ['email']
    }
  })
  @ApiResponse({ status: 201, description: 'Пользователь создан успешно' })
  @ApiResponse({ status: 400, description: 'Пользователь с такой почтой уже существует' })
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() data: { email: string; purchaseAmount?: number; spinsCount?: number }) {
    return await this.adminService.createUser(data);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Обновить данные пользователя' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email пользователя' },
        purchaseAmount: { type: 'number', description: 'Сумма покупки' },
        spinsCount: { type: 'number', description: 'Количество прокруток' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Пользователь обновлен успешно' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 400, description: 'Пользователь с такой почтой уже существует' })
  async updateUser(
    @Param('id') userId: string,
    @Body() data: { email?: string; purchaseAmount?: number; spinsCount?: number }
  ) {
    return await this.adminService.updateUser(parseInt(userId), data);
  }

  // ========== УПРАВЛЕНИЕ ПРИЗАМИ ==========

  @Get('prizes')
  @ApiOperation({ summary: 'Получить список всех призов' })
  @ApiResponse({ status: 200, description: 'Список призов получен успешно' })
  async getPrizes() {
    return await this.adminService.getPrizes();
  }

  @Post('prizes')
  @ApiOperation({ summary: 'Создать новый приз' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Название приза' },
        total_quantity: { type: 'number', description: 'Общее количество' },
        quantity_remaining: { type: 'number', description: 'Оставшееся количество' },
        type: { type: 'string', description: 'Тип приза (many, rare, limited)' },
        image: { type: 'string', description: 'URL изображения' },
        from_color: { type: 'string', description: 'Цвет начала градиента' },
        to_color: { type: 'string', description: 'Цвет конца градиента' },
        between_color: { type: 'string', description: 'Промежуточный цвет градиента' },
        text_color: { type: 'string', description: 'Цвет текста' },
        number: { type: 'number', description: 'Порядок расположения' }
      },
      required: ['name', 'total_quantity', 'quantity_remaining', 'number']
    }
  })
  @ApiResponse({ status: 201, description: 'Приз создан успешно' })
  @HttpCode(HttpStatus.CREATED)
  async createPrize(@Body() data: {
    name: string;
    total_quantity: number;
    quantity_remaining: number;
    type?: string;
    image?: string;
    from_color?: string;
    to_color?: string;
    between_color?: string;
    text_color?: string;
    number: number;
  }) {
    return await this.adminService.createPrize(data);
  }

  @Put('prizes/:id')
  @ApiOperation({ summary: 'Обновить приз' })
  @ApiParam({ name: 'id', description: 'ID приза' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Название приза' },
        total_quantity: { type: 'number', description: 'Общее количество' },
        quantity_remaining: { type: 'number', description: 'Оставшееся количество' },
        type: { type: 'string', description: 'Тип приза (many, rare, limited)' },
        image: { type: 'string', description: 'URL изображения' },
        from_color: { type: 'string', description: 'Цвет начала градиента' },
        to_color: { type: 'string', description: 'Цвет конца градиента' },
        between_color: { type: 'string', description: 'Промежуточный цвет градиента' },
        text_color: { type: 'string', description: 'Цвет текста' },
        number: { type: 'number', description: 'Порядок расположения' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Приз обновлен успешно' })
  @ApiResponse({ status: 404, description: 'Приз не найден' })
  async updatePrize(
    @Param('id') prizeId: string,
    @Body() data: {
      name?: string;
      total_quantity?: number;
      quantity_remaining?: number;
      type?: string;
      image?: string;
      from_color?: string;
      to_color?: string;
      between_color?: string;
      text_color?: string;
      number?: number;
    }
  ) {
    return await this.adminService.updatePrize(parseInt(prizeId), data);
  }

  @Delete('prizes/:id')
  @ApiOperation({ summary: 'Удалить приз' })
  @ApiParam({ name: 'id', description: 'ID приза' })
  @ApiResponse({ status: 200, description: 'Приз удален успешно' })
  @ApiResponse({ status: 404, description: 'Приз не найден' })
  @ApiResponse({ status: 400, description: 'Нельзя удалить приз, который уже использовался' })
  async deletePrize(@Param('id') prizeId: string) {
    return await this.adminService.deletePrize(parseInt(prizeId));
  }

  @Put('prizes/:id/quantity')
  @ApiOperation({ summary: 'Обновить количество выпадений приза' })
  @ApiParam({ name: 'id', description: 'ID приза' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: { type: 'number', description: 'Новое количество' }
      },
      required: ['quantity']
    }
  })
  @ApiResponse({ status: 200, description: 'Количество обновлено успешно' })
  @ApiResponse({ status: 404, description: 'Приз не найден' })
  async updatePrizeQuantity(
    @Param('id') prizeId: string,
    @Body() data: { quantity: number }
  ) {
    return await this.adminService.updatePrizeQuantity(parseInt(prizeId), data.quantity);
  }

  // ========== УПРАВЛЕНИЕ ОБЯЗАТЕЛЬНЫМИ ПРИЗАМИ ==========

  @Get('mandatory-prizes')
  @ApiOperation({ summary: 'Получить список всех обязательных призов' })
  @ApiResponse({ status: 200, description: 'Список обязательных призов получен успешно' })
  async getMandatoryPrizes() {
    return await this.adminService.getMandatoryPrizes();
  }

  @Post('mandatory-prizes')
  @ApiOperation({ summary: 'Создать новый обязательный приз' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prize_id: { type: 'number', description: 'ID приза' },
        target_quantity: { type: 'number', description: 'Целевое количество за период' },
        period_start: { type: 'string', format: 'date-time', description: 'Начало периода' },
        period_end: { type: 'string', format: 'date-time', description: 'Конец периода' }
      },
      required: ['prize_id', 'target_quantity', 'period_start', 'period_end']
    }
  })
  @ApiResponse({ status: 201, description: 'Обязательный приз создан успешно' })
  @ApiResponse({ status: 404, description: 'Приз не найден' })
  @HttpCode(HttpStatus.CREATED)
  async createMandatoryPrize(@Body() data: {
    prize_id: number;
    target_quantity: number;
    period_start: Date;
    period_end: Date;
  }) {
    return await this.adminService.createMandatoryPrize(data);
  }

  @Put('mandatory-prizes/:id')
  @ApiOperation({ summary: 'Обновить обязательный приз' })
  @ApiParam({ name: 'id', description: 'ID обязательного приза' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prize_id: { type: 'number', description: 'ID приза' },
        target_quantity: { type: 'number', description: 'Целевое количество за период' },
        period_start: { type: 'string', format: 'date-time', description: 'Начало периода' },
        period_end: { type: 'string', format: 'date-time', description: 'Конец периода' },
        is_active: { type: 'boolean', description: 'Активен ли период' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Обязательный приз обновлен успешно' })
  @ApiResponse({ status: 404, description: 'Обязательный приз не найден' })
  async updateMandatoryPrize(
    @Param('id') mandatoryPrizeId: string,
    @Body() data: {
      prize_id?: number;
      target_quantity?: number;
      period_start?: Date;
      period_end?: Date;
      is_active?: boolean;
    }
  ) {
    return await this.adminService.updateMandatoryPrize(parseInt(mandatoryPrizeId), data);
  }

  @Delete('mandatory-prizes/:id')
  @ApiOperation({ summary: 'Удалить обязательный приз' })
  @ApiParam({ name: 'id', description: 'ID обязательного приза' })
  @ApiResponse({ status: 200, description: 'Обязательный приз удален успешно' })
  @ApiResponse({ status: 404, description: 'Обязательный приз не найден' })
  async deleteMandatoryPrize(@Param('id') mandatoryPrizeId: string) {
    return await this.adminService.deleteMandatoryPrize(parseInt(mandatoryPrizeId));
  }
}
