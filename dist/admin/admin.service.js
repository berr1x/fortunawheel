"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../services/prisma.service");
const XLSX = __importStar(require("xlsx"));
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUsers(search) {
        const where = search ? {
            OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { customer_email: { contains: search, mode: 'insensitive' } }
            ]
        } : {};
        const users = await this.prisma.users.findMany({
            where,
            include: {
                purchases: {
                    select: {
                        amount: true,
                        spins_earned: true,
                        created_at: true
                    }
                },
                spin_sessions: {
                    select: {
                        spins_total: true,
                        spins_used: true,
                        is_active: true
                    }
                },
                spin_results: {
                    include: {
                        prize: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        return users.map(user => {
            const totalPurchaseAmount = user.purchases.reduce((sum, p) => sum + p.amount, 0);
            const totalSpinsEarned = user.purchases.reduce((sum, p) => sum + p.spins_earned, 0);
            const totalSpinsUsed = user.spin_sessions.reduce((sum, s) => sum + s.spins_used, 0);
            const wonPrizes = user.spin_results.reduce((acc, result) => {
                const prizeId = result.prize.id;
                const prizeName = result.prize.name;
                if (!acc[prizeId]) {
                    acc[prizeId] = {
                        id: prizeId,
                        name: prizeName,
                        type: result.prize.type,
                        count: 0
                    };
                }
                acc[prizeId].count++;
                return acc;
            }, {});
            return {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                totalPurchaseAmount,
                totalSpinsEarned,
                totalSpinsUsed,
                spinsRemaining: totalSpinsEarned - totalSpinsUsed,
                wonPrizes: Object.values(wonPrizes),
                purchasesCount: user.purchases.length,
                sessionsCount: user.spin_sessions.length
            };
        });
    }
    async getUserById(userId) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            include: {
                purchases: {
                    select: {
                        amount: true,
                        spins_earned: true,
                        created_at: true
                    }
                },
                spin_sessions: {
                    select: {
                        spins_total: true,
                        spins_used: true,
                        is_active: true
                    }
                },
                spin_results: {
                    include: {
                        prize: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return null;
        }
        const totalPurchaseAmount = user.purchases.reduce((sum, p) => sum + p.amount, 0);
        const totalSpinsEarned = user.purchases.reduce((sum, p) => sum + p.spins_earned, 0);
        const totalSpinsUsed = user.spin_sessions.reduce((sum, s) => sum + s.spins_used, 0);
        const wonPrizes = user.spin_results.reduce((acc, result) => {
            const prizeId = result.prize.id;
            const prizeName = result.prize.name;
            if (!acc[prizeId]) {
                acc[prizeId] = {
                    id: prizeId,
                    name: prizeName,
                    type: result.prize.type,
                    count: 0
                };
            }
            acc[prizeId].count++;
            return acc;
        }, {});
        return {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            totalPurchaseAmount,
            totalSpinsEarned,
            totalSpinsUsed,
            spinsRemaining: totalSpinsEarned - totalSpinsUsed,
            wonPrizes: Object.values(wonPrizes),
            purchasesCount: user.purchases.length,
            sessionsCount: user.spin_sessions.length
        };
    }
    async createUser(data) {
        const { email, purchaseAmount = 0, spinsCount = 0 } = data;
        const existingUser = await this.prisma.users.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Пользователь с такой почтой уже существует');
        }
        const user = await this.prisma.users.create({
            data: { email }
        });
        if (purchaseAmount > 0 || spinsCount > 0) {
            const purchase = await this.prisma.purchases.create({
                data: {
                    user_id: user.id,
                    amount: purchaseAmount,
                    spins_earned: spinsCount,
                    customer_email: email
                }
            });
            if (spinsCount > 0) {
                await this.prisma.spin_sessions.create({
                    data: {
                        user_id: user.id,
                        purchase_id: purchase.id,
                        spins_total: spinsCount,
                        spins_used: 0
                    }
                });
            }
        }
        return user;
    }
    async updateUser(userId, data) {
        const { email, purchaseAmount, spinsCount } = data;
        const user = await this.prisma.users.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        if (email && email !== user.email) {
            const existingUser = await this.prisma.users.findUnique({
                where: { email }
            });
            if (existingUser) {
                throw new common_1.BadRequestException('Пользователь с такой почтой уже существует');
            }
        }
        if (email) {
            await this.prisma.users.update({
                where: { id: userId },
                data: { email }
            });
        }
        if (purchaseAmount !== undefined || spinsCount !== undefined) {
            const purchase = await this.prisma.purchases.findFirst({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' }
            });
            if (purchase) {
                await this.prisma.purchases.update({
                    where: { id: purchase.id },
                    data: {
                        amount: purchaseAmount !== undefined ? purchaseAmount : purchase.amount,
                        spins_earned: spinsCount !== undefined ? spinsCount : purchase.spins_earned
                    }
                });
                const session = await this.prisma.spin_sessions.findFirst({
                    where: { purchase_id: purchase.id }
                });
                if (session && spinsCount !== undefined) {
                    await this.prisma.spin_sessions.update({
                        where: { id: session.id },
                        data: { spins_total: spinsCount, is_active: session.spins_total > session.spins_used ? true : false }
                    });
                }
            }
        }
        return { message: 'Пользователь успешно обновлен' };
    }
    async getPrizes() {
        return await this.prisma.prizes.findMany({
            orderBy: { number: 'asc' }
        });
    }
    async createPrize(data) {
        return await this.prisma.prizes.create({
            data
        });
    }
    async updatePrize(prizeId, data) {
        const prize = await this.prisma.prizes.findUnique({
            where: { id: prizeId }
        });
        if (!prize) {
            throw new common_1.NotFoundException('Приз не найден');
        }
        return await this.prisma.prizes.update({
            where: { id: prizeId },
            data
        });
    }
    async deletePrize(prizeId) {
        const prize = await this.prisma.prizes.findUnique({
            where: { id: prizeId }
        });
        if (!prize) {
            throw new common_1.NotFoundException('Приз не найден');
        }
        const spinResults = await this.prisma.spin_results.count({
            where: { prize_id: prizeId }
        });
        const mandatoryPrizes = await this.prisma.mandatory_prizes.count({
            where: { prize_id: prizeId }
        });
        if (spinResults > 0 || mandatoryPrizes > 0) {
            throw new common_1.BadRequestException('Нельзя удалить приз, который уже использовался в системе');
        }
        await this.prisma.prizes.delete({
            where: { id: prizeId }
        });
        return { message: 'Приз успешно удален' };
    }
    async updatePrizeQuantity(prizeId, quantity, type) {
        const prize = await this.prisma.prizes.findUnique({
            where: { id: prizeId }
        });
        if (!prize) {
            throw new common_1.NotFoundException('Приз не найден');
        }
        return await this.prisma.prizes.update({
            where: { id: prizeId },
            data: { quantity_remaining: quantity, type: type }
        });
    }
    async getMandatoryPrizes() {
        return await this.prisma.mandatory_prizes.findMany({
            include: {
                prize: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        image: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }
    async createMandatoryPrize(data) {
        const prize = await this.prisma.prizes.findUnique({
            where: { id: data.prize_id }
        });
        if (!prize) {
            throw new common_1.NotFoundException('Приз не найден');
        }
        return await this.prisma.mandatory_prizes.create({
            data: {
                ...data,
                issued_quantity: 0,
                is_active: true
            }
        });
    }
    async updateMandatoryPrize(mandatoryPrizeId, data) {
        const mandatoryPrize = await this.prisma.mandatory_prizes.findUnique({
            where: { id: mandatoryPrizeId }
        });
        if (!mandatoryPrize) {
            throw new common_1.NotFoundException('Обязательный приз не найден');
        }
        if (data.prize_id) {
            const prize = await this.prisma.prizes.findUnique({
                where: { id: data.prize_id }
            });
            if (!prize) {
                throw new common_1.NotFoundException('Приз не найден');
            }
        }
        return await this.prisma.mandatory_prizes.update({
            where: { id: mandatoryPrizeId },
            data
        });
    }
    async deleteMandatoryPrize(mandatoryPrizeId) {
        const mandatoryPrize = await this.prisma.mandatory_prizes.findUnique({
            where: { id: mandatoryPrizeId }
        });
        if (!mandatoryPrize) {
            throw new common_1.NotFoundException('Обязательный приз не найден');
        }
        await this.prisma.mandatory_prizes.delete({
            where: { id: mandatoryPrizeId }
        });
        return { message: 'Обязательный приз успешно удален' };
    }
    async getPurchasesData() {
        const purchases = await this.prisma.purchases.findMany({
            include: {
                user: {
                    select: {
                        email: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        return purchases.map(purchase => ({
            name: 'Не указано',
            phone: 'Не указан',
            email: purchase.user.email,
            product: 'Прокрутки колеса фортуны',
            amount: purchase.amount,
            spinsEarned: purchase.spins_earned,
            createdAt: purchase.created_at
        }));
    }
    async getSpinsData() {
        const users = await this.prisma.users.findMany({
            include: {
                purchases: {
                    select: {
                        amount: true,
                        spins_earned: true
                    }
                },
                spin_sessions: {
                    select: {
                        spins_total: true,
                        spins_used: true
                    }
                },
                spin_results: {
                    include: {
                        prize: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        return users.map(user => {
            const totalPurchaseAmount = user.purchases.reduce((sum, p) => sum + p.amount, 0);
            const totalSpinsEarned = user.purchases.reduce((sum, p) => sum + p.spins_earned, 0);
            const totalSpinsUsed = user.spin_sessions.reduce((sum, s) => sum + s.spins_used, 0);
            const spinsRemaining = totalSpinsEarned - totalSpinsUsed;
            const wonPrizes = user.spin_results.reduce((acc, result) => {
                const prizeName = result.prize.name;
                if (!acc[prizeName]) {
                    acc[prizeName] = 0;
                }
                acc[prizeName]++;
                return acc;
            }, {});
            const prizesString = Object.entries(wonPrizes)
                .map(([name, count]) => `${name} (${count})`)
                .join(', ');
            return {
                name: 'Не указано',
                phone: 'Не указан',
                email: user.email,
                purchaseAmount: totalPurchaseAmount,
                totalSpins: totalSpinsEarned,
                spinsRemaining: spinsRemaining,
                wonPrizes: prizesString || 'Нет выигранных призов',
                createdAt: user.created_at
            };
        });
    }
    async exportPurchasesToExcel() {
        const data = await this.getPurchasesData();
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Покупки');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }
    async exportSpinsToExcel() {
        const data = await this.getSpinsData();
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Прокрутки');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map