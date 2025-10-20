import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Response } from 'express';

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
        quantity: { type: 'number', description: 'Новое количество' },
        type: { type: 'string', description: 'Частота выпадения (many, rare, limited)' }
      },
      required: ['quantity']
    }
  })
  @ApiResponse({ status: 200, description: 'Количество обновлено успешно' })
  @ApiResponse({ status: 404, description: 'Приз не найден' })
  async updatePrizeQuantity(
    @Param('id') prizeId: string,
    @Body() data: { quantity: number, type: string }
  ) {
    return await this.adminService.updatePrizeQuantity(parseInt(prizeId), data.quantity, data.type);
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

  // ========== ЭКСПОРТ ДАННЫХ ==========

  @Get('export/purchases')
  @ApiOperation({ summary: 'Получить данные о покупках' })
  @ApiResponse({ 
    status: 200, 
    description: 'Данные о покупках получены успешно',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Не указано' },
          phone: { type: 'string', example: 'Не указан' },
          email: { type: 'string', example: 'test@mail.ru' },
          product: { type: 'string', example: 'Прокрутки колеса фортуны' },
          amount: { type: 'number', example: 4000 },
          spinsEarned: { type: 'number', example: 10 },
          createdAt: { type: 'string', format: 'date-time', example: '2025-10-20T21:26:08.222Z' }
        }
      },
      example: [
        {
          "name": "Не указано",
          "phone": "Не указан",
          "email": "test@mail.ru",
          "product": "Прокрутки колеса фортуны",
          "amount": 4000,
          "spinsEarned": 10,
          "createdAt": "2025-10-20T21:26:08.222Z"
        },
        {
          "name": "Не указано",
          "phone": "Не указан",
          "email": "kepera@inbox.ru",
          "product": "Прокрутки колеса фортуны",
          "amount": 50,
          "spinsEarned": 1,
          "createdAt": "2025-10-19T11:59:21.992Z"
        },
        {
          "name": "Не указано",
          "phone": "Не указан",
          "email": "kepera@inbox.ru",
          "product": "Прокрутки колеса фортуны",
          "amount": 50,
          "spinsEarned": 1,
          "createdAt": "2025-10-19T11:44:40.302Z"
        },
        {
          "name": "Не указано",
          "phone": "Не указан",
          "email": "timur@gmail.com",
          "product": "Прокрутки колеса фортуны",
          "amount": 10000,
          "spinsEarned": 100,
          "createdAt": "2025-10-01T14:59:11.916Z"
        }
      ]
    }
  })
  async getPurchasesData() {
    return await this.adminService.getPurchasesData();
  }

  @Get('export/purchases/excel')
  @ApiOperation({ summary: 'Экспортировать данные о покупках в Excel' })
  @ApiResponse({ status: 200, description: 'Excel файл с данными о покупках' })
  async exportPurchasesToExcel(@Res() res: Response) {
    const buffer = await this.adminService.exportPurchasesToExcel();
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="purchases.xlsx"',
      'Content-Length': buffer.length.toString(),
    });
    
    res.send(buffer);
  }

  @Get('export/spins')
  @ApiOperation({ summary: 'Получить данные о прокрутках' })
  @ApiResponse({ 
    status: 200, 
    description: 'Данные о прокрутках получены успешно',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Не указано' },
          phone: { type: 'string', example: 'Не указан' },
          email: { type: 'string', example: 'test@mail.ru' },
          purchaseAmount: { type: 'number', example: 4000 },
          totalSpins: { type: 'number', example: 10 },
          spinsRemaining: { type: 'number', example: 5 },
          wonPrizes: { type: 'string', example: 'Промокод MY CAKE (2), Миксер стационарный (1)' },
          createdAt: { type: 'string', format: 'date-time', example: '2025-10-20T21:26:08.222Z' }
        }
      },
      example: [
        {
          "name": "Не указано",
          "phone": "Не указан",
          "email": "test@mail.ru",
          "purchaseAmount": 4000,
          "totalSpins": 10,
          "spinsRemaining": 5,
          "wonPrizes": "Промокод MY CAKE (2), Миксер стационарный (1)",
          "createdAt": "2025-10-20T21:26:08.222Z"
        },
        {
          "name": "Не указано",
          "phone": "Не указан",
          "email": "kepera@inbox.ru",
          "purchaseAmount": 100,
          "totalSpins": 2,
          "spinsRemaining": 0,
          "wonPrizes": "Блендер (2)",
          "createdAt": "2025-10-19T11:59:21.992Z"
        }
      ]
    }
  })
  async getSpinsData() {
    return await this.adminService.getSpinsData();
  }

  @Get('export/spins/excel')
  @ApiOperation({ summary: 'Экспортировать данные о прокрутках в Excel' })
  @ApiResponse({ status: 200, description: 'Excel файл с данными о прокрутках' })
  async exportSpinsToExcel(@Res() res: Response) {
    const buffer = await this.adminService.exportSpinsToExcel();
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="spins.xlsx"',
      'Content-Length': buffer.length.toString(),
    });
    
    res.send(buffer);
  }
}
