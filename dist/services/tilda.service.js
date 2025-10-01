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
var TildaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TildaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let TildaService = TildaService_1 = class TildaService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TildaService_1.name);
    }
    async processPurchase(webhookData) {
        try {
            const { email, amount, order_id } = this.validateWebhookData(webhookData);
            const spinsEarned = this.calculateSpins(amount);
            this.logger.log(`Processing purchase: email=${email}, amount=${amount}, spins=${spinsEarned}`);
            if (spinsEarned === 0) {
                this.logger.warn(`No spins earned for amount ${amount}, skipping session creation`);
                return {
                    success: true,
                    message: 'Purchase processed but no spins earned',
                    spinsEarned: 0
                };
            }
            return await this.prisma.$transaction(async (tx) => {
                const user = await this.findOrCreateUser(tx, email);
                const purchase = await this.createPurchase(tx, user.id, {
                    order_id,
                    amount,
                    spins_earned: spinsEarned,
                    customer_email: email,
                });
                const session = await this.createSpinSession(tx, user.id, purchase.id, spinsEarned);
                this.logger.log(`Successfully created session ${session.id} with ${spinsEarned} spins for user ${email}`);
                return {
                    success: true,
                    message: 'Purchase processed successfully',
                    sessionId: session.id,
                    spinsEarned,
                    userId: user.id,
                };
            });
        }
        catch (error) {
            this.logger.error('Error processing purchase:', error);
            throw new common_1.BadRequestException('Failed to process purchase');
        }
    }
    validateWebhookData(data) {
        if (!data) {
            throw new common_1.BadRequestException('Webhook data is required');
        }
        const { email, amount, order_id } = data;
        if (!email || typeof email !== 'string') {
            throw new common_1.BadRequestException('Valid email is required');
        }
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            throw new common_1.BadRequestException('Valid amount is required');
        }
        if (!order_id || typeof order_id !== 'string') {
            throw new common_1.BadRequestException('Valid order_id is required');
        }
        return { email, amount, order_id };
    }
    calculateSpins(amount) {
        return Math.floor(amount / 3000);
    }
    async findOrCreateUser(tx, email) {
        let user = await tx.users.findUnique({
            where: { email },
        });
        if (!user) {
            user = await tx.users.create({
                data: { email },
            });
            this.logger.log(`Created new user: ${email}`);
        }
        return user;
    }
    async createPurchase(tx, userId, orderData) {
        return await tx.purchases.create({
            data: {
                user_id: userId,
                order_id: orderData.order_id,
                amount: orderData.amount,
                spins_earned: orderData.spins_earned,
                customer_email: orderData.customer_email,
                data: orderData,
            },
        });
    }
    async createSpinSession(tx, userId, purchaseId, spinsTotal) {
        return await tx.spin_sessions.create({
            data: {
                user_id: userId,
                purchase_id: purchaseId,
                spins_total: spinsTotal,
                spins_used: 0,
                is_active: true,
            },
        });
    }
};
exports.TildaService = TildaService;
exports.TildaService = TildaService = TildaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TildaService);
//# sourceMappingURL=tilda.service.js.map