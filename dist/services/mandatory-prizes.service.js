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
exports.MandatoryPrizesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const api_config_1 = require("../config/api.config");
let MandatoryPrizesService = class MandatoryPrizesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getPrizeImageUrl(imagePath) {
        if (!imagePath)
            return null;
        return `${api_config_1.BACKEND_URL}${imagePath}`;
    }
    async createMandatoryPrize(prizeId, targetQuantity) {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const mandatoryPrize = await this.prisma.mandatory_prizes.create({
            data: {
                prize_id: prizeId,
                target_quantity: targetQuantity,
                issued_quantity: 0,
                period_start: now,
                period_end: periodEnd,
                is_active: true,
            },
            include: {
                prize: {
                    select: {
                        id: true,
                        name: true,
                        quantity_remaining: true,
                        image: true,
                    },
                },
            },
        });
        return {
            ...mandatoryPrize,
            prize: {
                ...mandatoryPrize.prize,
                image: this.getPrizeImageUrl(mandatoryPrize.prize.image),
            },
        };
    }
    async getActiveMandatoryPrizes() {
        const now = new Date();
        const mandatoryPrizes = await this.prisma.mandatory_prizes.findMany({
            where: {
                is_active: true,
                period_start: {
                    lte: now,
                },
                period_end: {
                    gte: now,
                },
            },
            include: {
                prize: {
                    select: {
                        id: true,
                        name: true,
                        quantity_remaining: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                created_at: 'asc',
            },
        });
        return mandatoryPrizes.map(mandatoryPrize => ({
            ...mandatoryPrize,
            prize: {
                ...mandatoryPrize.prize,
                image: this.getPrizeImageUrl(mandatoryPrize.prize.image),
            },
        }));
    }
    async incrementIssuedQuantity(mandatoryPrizeId) {
        const mandatoryPrize = await this.prisma.mandatory_prizes.update({
            where: { id: mandatoryPrizeId },
            data: {
                issued_quantity: {
                    increment: 1,
                },
            },
            include: {
                prize: {
                    select: {
                        id: true,
                        name: true,
                        quantity_remaining: true,
                        image: true,
                    },
                },
            },
        });
        return {
            ...mandatoryPrize,
            prize: {
                ...mandatoryPrize.prize,
                image: this.getPrizeImageUrl(mandatoryPrize.prize.image),
            },
        };
    }
    shouldIssueMandatoryPrize(mandatoryPrize) {
        const now = new Date();
        const timeRemaining = mandatoryPrize.period_end.getTime() - now.getTime();
        const hoursRemaining = timeRemaining / (1000 * 60 * 60);
        const prizesRemaining = mandatoryPrize.target_quantity - mandatoryPrize.issued_quantity;
        if (hoursRemaining <= 2 && prizesRemaining > 0) {
            return true;
        }
        if (hoursRemaining <= 6 && mandatoryPrize.issued_quantity < mandatoryPrize.target_quantity / 2) {
            return true;
        }
        return false;
    }
    async getPriorityMandatoryPrizes() {
        const activePrizes = await this.getActiveMandatoryPrizes();
        return activePrizes.filter(prize => this.shouldIssueMandatoryPrize(prize));
    }
    async deactivateExpiredPeriods() {
        const now = new Date();
        const result = await this.prisma.mandatory_prizes.updateMany({
            where: {
                is_active: true,
                period_end: {
                    lt: now,
                },
            },
            data: {
                is_active: false,
            },
        });
        return result.count;
    }
    async createDailyMandatoryPrizes() {
        await this.deactivateExpiredPeriods();
        const dailyTargets = [
            { prizeId: 8, targetQuantity: 1 },
            { prizeId: 9, targetQuantity: 2 },
            { prizeId: 10, targetQuantity: 3 },
            { prizeId: 11, targetQuantity: 3 },
            { prizeId: 12, targetQuantity: 2 },
        ];
        for (const target of dailyTargets) {
            const existing = await this.prisma.mandatory_prizes.findFirst({
                where: {
                    prize_id: target.prizeId,
                    is_active: true,
                },
            });
            if (!existing) {
                await this.createMandatoryPrize(target.prizeId, target.targetQuantity);
            }
        }
    }
};
exports.MandatoryPrizesService = MandatoryPrizesService;
exports.MandatoryPrizesService = MandatoryPrizesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MandatoryPrizesService);
//# sourceMappingURL=mandatory-prizes.service.js.map