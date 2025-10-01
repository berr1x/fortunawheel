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
exports.WheelService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const redis_service_1 = require("./redis.service");
const mandatory_prizes_service_1 = require("./mandatory-prizes.service");
const api_config_1 = require("../config/api.config");
let WheelService = class WheelService {
    constructor(prisma, redis, mandatoryPrizesService) {
        this.prisma = prisma;
        this.redis = redis;
        this.mandatoryPrizesService = mandatoryPrizesService;
    }
    getPrizeImageUrl(imagePath) {
        if (!imagePath)
            return null;
        return `${api_config_1.BACKEND_URL}${imagePath}`;
    }
    async createOrGetSession(email, purchaseId) {
        return await this.prisma.$transaction(async (tx) => {
            const user = await tx.users.findUnique({
                where: { email },
            });
            if (!user) {
                throw new common_1.NotFoundException('Пользователь не найден.');
            }
            const session = await tx.spin_sessions.findFirst({
                where: {
                    user_id: user.id,
                    is_active: true,
                },
            });
            if (session) {
                return {
                    sessionId: session.id.toString(),
                    spinsRemaining: session.spins_total - session.spins_used,
                };
            }
            const purchases = await tx.purchases.findMany({
                where: {
                    user_id: user.id,
                },
                orderBy: {
                    created_at: 'desc',
                },
            });
            if (purchases.length === 0) {
                throw new common_1.NotFoundException('У вас нет доступных прокруток.');
            }
            const purchasesWithSessions = await tx.spin_sessions.findMany({
                where: {
                    user_id: user.id,
                },
                select: {
                    purchase_id: true,
                },
            });
            const usedPurchaseIds = new Set(purchasesWithSessions.map(s => s.purchase_id));
            const availablePurchases = purchases.filter(p => !usedPurchaseIds.has(p.id));
            if (availablePurchases.length === 0) {
                throw new common_1.NotFoundException('Все ваши покупки уже использованы.');
            }
            if (purchaseId) {
                const purchase = availablePurchases.find(p => p.id === purchaseId);
                if (!purchase) {
                    throw new common_1.NotFoundException('Указанная покупка не найдена или уже использована');
                }
                const newSession = await tx.spin_sessions.create({
                    data: {
                        user_id: user.id,
                        purchase_id: purchase.id,
                        spins_total: purchase.spins_earned,
                        spins_used: 0,
                        is_active: true,
                    },
                });
                return {
                    sessionId: newSession.id.toString(),
                    spinsRemaining: newSession.spins_total - newSession.spins_used,
                };
            }
            const selectedPurchase = availablePurchases[0];
            const newSession = await tx.spin_sessions.create({
                data: {
                    user_id: user.id,
                    purchase_id: selectedPurchase.id,
                    spins_total: selectedPurchase.spins_earned,
                    spins_used: 0,
                    is_active: true,
                },
            });
            return {
                sessionId: newSession.id.toString(),
                spinsRemaining: newSession.spins_total - newSession.spins_used,
            };
        });
    }
    async spinWheel(sessionId) {
        return await this.prisma.$transaction(async (tx) => {
            const session = await tx.spin_sessions.findFirst({
                where: {
                    id: parseInt(sessionId),
                    is_active: true,
                },
                include: {
                    user: true,
                    purchase: true,
                    results: {
                        include: {
                            prize: true,
                        },
                    },
                },
            });
            if (!session) {
                throw new common_1.NotFoundException('Сессия не найдена или неактивна');
            }
            if (session.spins_used >= session.spins_total) {
                throw new common_1.BadRequestException('Все прокрутки использованы');
            }
            const availablePrizes = await tx.prizes.findMany({
                where: {
                    quantity_remaining: {
                        gt: 0,
                    },
                },
                orderBy: {
                    id: 'asc',
                },
            });
            if (availablePrizes.length === 0) {
                throw new common_1.BadRequestException('Нет доступных призов');
            }
            const selectedPrize = await this.selectPrize(availablePrizes, session.results, session.spins_used, tx);
            if (!selectedPrize) {
                throw new common_1.BadRequestException('Не удалось выбрать приз');
            }
            await tx.prizes.update({
                where: { id: selectedPrize.id },
                data: {
                    quantity_remaining: {
                        decrement: 1,
                    },
                },
            });
            const mandatoryPrizes = await this.mandatoryPrizesService.getActiveMandatoryPrizes();
            const mandatoryPrize = mandatoryPrizes.find(mp => mp.prize.id === selectedPrize.id);
            if (mandatoryPrize) {
                await this.mandatoryPrizesService.incrementIssuedQuantity(mandatoryPrize.id);
                console.log(`🎯 Выдан обязательный подарок: ${selectedPrize.name} (${mandatoryPrize.issued_quantity + 1}/${mandatoryPrize.target_quantity})`);
            }
            const spinResult = await tx.spin_results.create({
                data: {
                    spin_session_id: session.id,
                    prize_id: selectedPrize.id,
                    user_id: session.user_id,
                    purchase_id: session.purchase_id,
                    status: 'issued',
                },
                include: {
                    prize: true,
                },
            });
            await tx.spin_sessions.update({
                where: { id: session.id },
                data: {
                    spins_used: {
                        increment: 1,
                    },
                },
            });
            if (session.spins_used + 1 >= session.spins_total) {
                await tx.spin_sessions.update({
                    where: { id: session.id },
                    data: {
                        is_active: false,
                    },
                });
            }
            return {
                prize: spinResult.prize.name,
                success: true,
                prizeId: spinResult.prize.id,
                sessionId: sessionId,
                prizeImage: this.getPrizeImageUrl(spinResult.prize.image),
            };
        });
    }
    async selectPrize(availablePrizes, previousResults, spinsUsed, tx) {
        const wonPrizeIds = previousResults.map(result => result.prize_id);
        const mandatoryPrizes = await this.getMandatoryPrizes(tx);
        if (spinsUsed < 5) {
            const unclaimedPrizes = availablePrizes.filter(prize => !wonPrizeIds.includes(prize.id));
            if (unclaimedPrizes.length > 0) {
                const unclaimedMandatory = unclaimedPrizes.filter(prize => mandatoryPrizes.some(mp => mp.prize.id === prize.id));
                if (unclaimedMandatory.length > 0) {
                    return this.selectRandomPrize(unclaimedMandatory);
                }
                return this.selectRandomPrize(unclaimedPrizes);
            }
        }
        if (spinsUsed >= 5) {
            const availableMandatory = availablePrizes.filter(prize => mandatoryPrizes.some(mp => mp.prize.id === prize.id));
            if (availableMandatory.length > 0) {
                if (Math.random() < 0.7) {
                    return this.selectRandomPrize(availableMandatory);
                }
            }
            const abundantPrizes = availablePrizes.filter(prize => prize.type === 'many' || prize.quantity_remaining > 50);
            const limitedPrizes = availablePrizes.filter(prize => prize.type === 'limited' || (prize.quantity_remaining <= 50 && prize.quantity_remaining > 10));
            const rarePrizes = availablePrizes.filter(prize => prize.type === 'rare' || prize.quantity_remaining <= 10);
            const random = Math.random();
            if (random < 0.6 && abundantPrizes.length > 0) {
                return this.selectRandomPrize(abundantPrizes);
            }
            else if (random < 0.9 && limitedPrizes.length > 0) {
                return this.selectRandomPrize(limitedPrizes);
            }
            else if (rarePrizes.length > 0) {
                return this.selectRandomPrize(rarePrizes);
            }
        }
        return this.selectRandomPrize(availablePrizes);
    }
    async getMandatoryPrizes(tx) {
        return await this.mandatoryPrizesService.getPriorityMandatoryPrizes();
    }
    selectRandomPrize(prizes) {
        if (prizes.length === 0) {
            throw new Error('Нет призов для выбора');
        }
        const randomIndex = Math.floor(Math.random() * prizes.length);
        return prizes[randomIndex];
    }
    async getAvailablePrizes() {
        const prizes = await this.prisma.prizes.findMany({
            where: {
                quantity_remaining: {
                    gt: 0,
                },
            },
            orderBy: {
                id: 'asc',
            },
        });
        return prizes.map(prize => ({
            ...prize,
            image: this.getPrizeImageUrl(prize.image),
        }));
    }
    async getUserWonPrizes(email) {
        const user = await this.prisma.users.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const wonPrizes = await this.prisma.spin_results.findMany({
            where: {
                user_id: user.id,
            },
            include: {
                prize: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        image: true,
                    },
                },
                session: {
                    select: {
                        id: true,
                        created_at: true,
                    },
                },
                purchase: {
                    select: {
                        id: true,
                        order_id: true,
                        amount: true,
                        created_at: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        return wonPrizes.map(result => ({
            id: result.id,
            prize: {
                id: result.prize.id,
                name: result.prize.name,
                type: result.prize.type,
                image: this.getPrizeImageUrl(result.prize.image),
            },
            session: {
                id: result.session.id,
                createdAt: result.session.created_at,
            },
            purchase: {
                id: result.purchase.id,
                orderId: result.purchase.order_id,
                amount: result.purchase.amount,
                createdAt: result.purchase.created_at,
            },
            status: result.status,
            wonAt: result.created_at,
        }));
    }
};
exports.WheelService = WheelService;
exports.WheelService = WheelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        mandatory_prizes_service_1.MandatoryPrizesService])
], WheelService);
//# sourceMappingURL=wheel.service.js.map