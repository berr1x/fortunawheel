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
exports.EmailProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const email_queue_service_1 = require("../services/email-queue.service");
const sendsay_service_1 = require("../services/sendsay.service");
let EmailProcessor = class EmailProcessor {
    constructor(emailQueueService, sendsayService) {
        this.emailQueueService = emailQueueService;
        this.sendsayService = sendsayService;
    }
    async handleEmail(job) {
        await this.emailQueueService.processEmailJob(job);
    }
};
exports.EmailProcessor = EmailProcessor;
__decorate([
    (0, bull_1.Process)('send-email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleEmail", null);
exports.EmailProcessor = EmailProcessor = __decorate([
    (0, bull_1.Processor)('email'),
    __metadata("design:paramtypes", [email_queue_service_1.EmailQueueService,
        sendsay_service_1.SendsayService])
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map