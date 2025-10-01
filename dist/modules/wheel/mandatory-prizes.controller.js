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
exports.MandatoryPrizesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mandatory_prizes_service_1 = require("../../services/mandatory-prizes.service");
let MandatoryPrizesController = class MandatoryPrizesController {
    constructor(mandatoryPrizesService) {
        this.mandatoryPrizesService = mandatoryPrizesService;
    }
    async getActiveMandatoryPrizes() {
        return await this.mandatoryPrizesService.getActiveMandatoryPrizes();
    }
    async getPriorityMandatoryPrizes() {
        return await this.mandatoryPrizesService.getPriorityMandatoryPrizes();
    }
    async createMandatoryPrize(body) {
        if (!body.prizeId || !body.targetQuantity) {
            throw new common_1.BadRequestException('prizeId и targetQuantity обязательны');
        }
        if (body.targetQuantity <= 0) {
            throw new common_1.BadRequestException('targetQuantity должно быть больше 0');
        }
        return await this.mandatoryPrizesService.createMandatoryPrize(body.prizeId, body.targetQuantity);
    }
    async createDailyMandatoryPrizes() {
        await this.mandatoryPrizesService.createDailyMandatoryPrizes();
        return { message: 'Ежедневные обязательные подарки созданы успешно' };
    }
    async deactivateExpiredPeriods() {
        const count = await this.mandatoryPrizesService.deactivateExpiredPeriods();
        return { message: `Деактивировано ${count} завершенных периодов` };
    }
};
exports.MandatoryPrizesController = MandatoryPrizesController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get active mandatory prizes' }),
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MandatoryPrizesController.prototype, "getActiveMandatoryPrizes", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get priority mandatory prizes' }),
    (0, common_1.Get)('priority'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MandatoryPrizesController.prototype, "getPriorityMandatoryPrizes", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create mandatory prize' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                prizeId: { type: 'number', description: 'ID приза' },
                targetQuantity: { type: 'number', description: 'Целевое количество для выдачи за 24 часа' }
            },
            required: ['prizeId', 'targetQuantity']
        }
    }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MandatoryPrizesController.prototype, "createMandatoryPrize", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create daily mandatory prizes' }),
    (0, common_1.Post)('daily'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MandatoryPrizesController.prototype, "createDailyMandatoryPrizes", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate expired periods' }),
    (0, common_1.Post)('deactivate-expired'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MandatoryPrizesController.prototype, "deactivateExpiredPeriods", null);
exports.MandatoryPrizesController = MandatoryPrizesController = __decorate([
    (0, swagger_1.ApiTags)('mandatory-prizes'),
    (0, common_1.Controller)('mandatory-prizes'),
    __metadata("design:paramtypes", [mandatory_prizes_service_1.MandatoryPrizesService])
], MandatoryPrizesController);
//# sourceMappingURL=mandatory-prizes.controller.js.map