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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendsayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SendsayService = class SendsayService {
    constructor(configService) {
        this.configService = configService;
        this.apiUrl = 'https://api.sendsay.ru/api/v1/json/';
    }
    async sendEmail(to, subject, body) {
        const login = this.configService.get('SENDSAY_LOGIN');
        const password = this.configService.get('SENDSAY_PASSWORD');
        const subaccount = this.configService.get('SENDSAY_SUBACCOUNT');
        try {
            console.log('Sending email via Sendsay:', { to, subject });
            return { success: true };
        }
        catch (error) {
            console.error('Sendsay error:', error);
            return { success: false, error: error.message };
        }
    }
};
exports.SendsayService = SendsayService;
exports.SendsayService = SendsayService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SendsayService);
//# sourceMappingURL=sendsay.service.js.map