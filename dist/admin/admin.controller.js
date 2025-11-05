"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getUsers(search) {
        return await this.adminService.getUsers(search);
    }
    async getUserById(userId) {
        return await this.adminService.getUserById(parseInt(userId));
    }
    async createUser(data) {
        return await this.adminService.createUser(data);
    }
    async updateUser(userId, data) {
        return await this.adminService.updateUser(parseInt(userId), data);
    }
    async getPrizes() {
        return await this.adminService.getPrizes();
    }
    async createPrize(data) {
        return await this.adminService.createPrize(data);
    }
    async updatePrize(prizeId, data) {
        return await this.adminService.updatePrize(parseInt(prizeId), data);
    }
    async deletePrize(prizeId) {
        return await this.adminService.deletePrize(parseInt(prizeId));
    }
    async updatePrizeQuantity(prizeId, data) {
        return await this.adminService.updatePrizeQuantity(parseInt(prizeId), data.quantity, data.type);
    }
    async getMandatoryPrizes() {
        return await this.adminService.getMandatoryPrizes();
    }
    async createMandatoryPrize(data) {
        return await this.adminService.createMandatoryPrize(data);
    }
    async updateMandatoryPrize(mandatoryPrizeId, data) {
        return await this.adminService.updateMandatoryPrize(parseInt(mandatoryPrizeId), data);
    }
    async deleteMandatoryPrize(mandatoryPrizeId) {
        return await this.adminService.deleteMandatoryPrize(parseInt(mandatoryPrizeId));
    }
    async getPurchasesData(search) {
        return await this.adminService.getPurchasesData(search);
    }
    async exportPurchasesToExcel(res) {
        const buffer = await this.adminService.exportPurchasesToExcel();
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="purchases.xlsx"',
            'Content-Length': buffer.length.toString(),
        });
        res.send(buffer);
    }
    async getSpinsData(search) {
        return await this.adminService.getSpinsData(search);
    }
    async exportSpinsToExcel(res) {
        const buffer = await this.adminService.exportSpinsToExcel();
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="spins.xlsx"',
            'Content-Length': buffer.length.toString(),
        });
        res.send(buffer);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить список всех пользователей' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Поиск по email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Список пользователей получен успешно' }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить данные пользователя по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID пользователя' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Данные пользователя получены успешно' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Создать нового пользователя' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', description: 'Email пользователя' },
                purchaseAmount: { type: 'number', description: 'Сумма покупки' },
                spinsCount: { type: 'number', description: 'Количество прокруток' }
            },
            required: ['email']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Пользователь создан успешно' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Пользователь с такой почтой уже существует' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить данные пользователя' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID пользователя' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', description: 'Email пользователя' },
                purchaseAmount: { type: 'number', description: 'Сумма покупки' },
                spinsCount: { type: 'number', description: 'Количество прокруток' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Пользователь обновлен успешно' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Пользователь не найден' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Пользователь с такой почтой уже существует' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('prizes'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить список всех призов' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Список призов получен успешно' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPrizes", null);
__decorate([
    (0, common_1.Post)('prizes'),
    (0, swagger_1.ApiOperation)({ summary: 'Создать новый приз' }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Приз создан успешно' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPrize", null);
__decorate([
    (0, common_1.Put)('prizes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить приз' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID приза' }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Приз обновлен успешно' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Приз не найден' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePrize", null);
__decorate([
    (0, common_1.Delete)('prizes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить приз' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID приза' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Приз удален успешно' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Приз не найден' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Нельзя удалить приз, который уже использовался' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deletePrize", null);
__decorate([
    (0, common_1.Put)('prizes/:id/quantity'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить количество выпадений приза' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID приза' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                quantity: { type: 'number', description: 'Новое количество' },
                type: { type: 'string', description: 'Частота выпадения (many, rare, limited)' }
            },
            required: ['quantity']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Количество обновлено успешно' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Приз не найден' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePrizeQuantity", null);
__decorate([
    (0, common_1.Get)('mandatory-prizes'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить список всех обязательных призов' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Список обязательных призов получен успешно' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMandatoryPrizes", null);
__decorate([
    (0, common_1.Post)('mandatory-prizes'),
    (0, swagger_1.ApiOperation)({ summary: 'Создать новый обязательный приз' }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Обязательный приз создан успешно' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Приз не найден' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createMandatoryPrize", null);
__decorate([
    (0, common_1.Put)('mandatory-prizes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить обязательный приз' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID обязательного приза' }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Обязательный приз обновлен успешно' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Обязательный приз не найден' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateMandatoryPrize", null);
__decorate([
    (0, common_1.Delete)('mandatory-prizes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить обязательный приз' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID обязательного приза' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Обязательный приз удален успешно' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Обязательный приз не найден' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteMandatoryPrize", null);
__decorate([
    (0, common_1.Get)('export/purchases'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить данные о покупках' }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPurchasesData", null);
__decorate([
    (0, common_1.Get)('export/purchases/excel'),
    (0, swagger_1.ApiOperation)({ summary: 'Экспортировать данные о покупках в Excel' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Excel файл с данными о покупках' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportPurchasesToExcel", null);
__decorate([
    (0, common_1.Get)('export/spins'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить данные о прокрутках' }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSpinsData", null);
__decorate([
    (0, common_1.Get)('export/spins/excel'),
    (0, swagger_1.ApiOperation)({ summary: 'Экспортировать данные о прокрутках в Excel' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Excel файл с данными о прокрутках' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportSpinsToExcel", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map