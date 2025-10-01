"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WheelModule = void 0;
const common_1 = require("@nestjs/common");
const wheel_controller_1 = require("./wheel.controller");
const mandatory_prizes_controller_1 = require("./mandatory-prizes.controller");
const wheel_service_1 = require("../../services/wheel.service");
const prisma_service_1 = require("../../services/prisma.service");
const redis_service_1 = require("../../services/redis.service");
const mandatory_prizes_service_1 = require("../../services/mandatory-prizes.service");
let WheelModule = class WheelModule {
};
exports.WheelModule = WheelModule;
exports.WheelModule = WheelModule = __decorate([
    (0, common_1.Module)({
        controllers: [wheel_controller_1.WheelController, mandatory_prizes_controller_1.MandatoryPrizesController],
        providers: [wheel_service_1.WheelService, prisma_service_1.PrismaService, redis_service_1.RedisService, mandatory_prizes_service_1.MandatoryPrizesService],
    })
], WheelModule);
//# sourceMappingURL=wheel.module.js.map