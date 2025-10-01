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
var TildaController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TildaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tilda_service_1 = require("../../services/tilda.service");
let TildaController = TildaController_1 = class TildaController {
    constructor(tildaService) {
        this.tildaService = tildaService;
        this.logger = new common_1.Logger(TildaController_1.name);
    }
    async webhook(body, headers) {
        try {
            this.logger.log('Received Tilda webhook', { body, headers });
            const result = await this.tildaService.processPurchase(body);
            this.logger.log('Webhook processed successfully', result);
            return result;
        }
        catch (error) {
            this.logger.error('Error processing Tilda webhook:', error);
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'Internal server error',
                error: 'WEBHOOK_PROCESSING_ERROR'
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.TildaController = TildaController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Webhook from Tilda about new purchase' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Purchase processed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid webhook data' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TildaController.prototype, "webhook", null);
exports.TildaController = TildaController = TildaController_1 = __decorate([
    (0, swagger_1.ApiTags)('tilda'),
    (0, common_1.Controller)('tilda'),
    __metadata("design:paramtypes", [tilda_service_1.TildaService])
], TildaController);
//# sourceMappingURL=tilda.controller.js.map