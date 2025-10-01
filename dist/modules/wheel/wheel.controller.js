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
exports.WheelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wheel_service_1 = require("../../services/wheel.service");
let WheelController = class WheelController {
    constructor(wheelService) {
        this.wheelService = wheelService;
    }
    async getSession(email) {
        if (!email || !email.includes('@')) {
            throw new common_1.BadRequestException('Некорректный email адрес');
        }
        try {
            const session = await this.wheelService.createOrGetSession(email);
            return {
                success: true,
                ...session
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                return {
                    success: false,
                    message: error.message,
                    sessionId: null,
                    spinsRemaining: 0
                };
            }
            throw error;
        }
    }
    async spin(sessionId) {
        if (!sessionId) {
            throw new common_1.BadRequestException('Session ID is required');
        }
        const result = await this.wheelService.spinWheel(sessionId);
        return result;
    }
    async getPrizes() {
        const prizes = await this.wheelService.getAvailablePrizes();
        return prizes;
    }
    async getWonPrizes(email) {
        if (!email || !email.includes('@')) {
            throw new common_1.BadRequestException('Некорректный email адрес');
        }
        try {
            const wonPrizes = await this.wheelService.getUserWonPrizes(email);
            return {
                success: true,
                prizes: wonPrizes,
                totalCount: wonPrizes.length
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                return {
                    success: false,
                    message: error.message,
                    prizes: [],
                    totalCount: 0
                };
            }
            throw error;
        }
    }
};
exports.WheelController = WheelController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create or get session by email' }),
    (0, swagger_1.ApiQuery)({ name: 'email', description: 'User email address', example: 'user@example.com' }),
    (0, common_1.Get)('session'),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "getSession", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Spin the wheel' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string', description: 'Session ID for spinning' }
            },
            required: ['sessionId']
        }
    }),
    (0, common_1.Post)('spin'),
    __param(0, (0, common_1.Body)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "spin", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get available prizes' }),
    (0, common_1.Get)('prizes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "getPrizes", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get user won prizes' }),
    (0, swagger_1.ApiQuery)({ name: 'email', description: 'User email address', example: 'user@example.com' }),
    (0, common_1.Get)('won-prizes'),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "getWonPrizes", null);
exports.WheelController = WheelController = __decorate([
    (0, swagger_1.ApiTags)('wheel'),
    (0, common_1.Controller)('wheel'),
    __metadata("design:paramtypes", [wheel_service_1.WheelService])
], WheelController);
//# sourceMappingURL=wheel.controller.js.map