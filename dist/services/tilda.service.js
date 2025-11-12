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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TildaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TildaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const path_1 = require("path");
let TildaService = TildaService_1 = class TildaService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TildaService_1.name);
        this.SENDSAY_API_URL = 'https://api.sendsay.ru/general/api/v100/json/cakeschool';
        try {
            const templatePath = (0, path_1.join)(__dirname, '..', 'mails', 'registration.html');
            this.WHEEL_EMAIL_HTML = (0, fs_1.readFileSync)(templatePath, 'utf-8');
            this.logger.log('Registration email template loaded successfully');
        }
        catch (error) {
            this.logger.error('Failed to load registration email template:', error);
            throw new Error('Failed to load registration email template');
        }
    }
    async processPurchase(webhookData) {
        try {
            const { Name, Email, Phone, payment } = webhookData;
            if (!Email || !payment || !payment.amount || !payment.orderid || !Name) {
                return {
                    success: false,
                    message: 'Invalid webhook data',
                };
            }
            const products = payment.products ? payment.products.map((product) => product.name) : [];
            const spinsEarned = this.calculateSpins(Number(payment.amount));
            this.logger.log(`Processing purchase: email=${Email}, phone=${Phone}, amount=${payment.amount}, spins=${spinsEarned}, products=${JSON.stringify(products)}`);
            return await this.prisma.$transaction(async (tx) => {
                const user = await this.findOrCreateUser(tx, Email);
                const purchase = await this.createPurchase(tx, user.id, {
                    order_id: payment.orderid,
                    amount: Number(payment.amount),
                    spins_earned: spinsEarned,
                    customer_email: Email,
                    phone: Phone,
                    products: products,
                    name: Name
                });
                let session = null;
                if (spinsEarned > 0) {
                    session = await this.createSpinSession(tx, user.id, purchase.id, spinsEarned);
                    this.logger.log(`Successfully created session ${session.id} with ${spinsEarned} spins for user ${Email}`);
                    try {
                        await this.sendWheelEmail(Email);
                        this.logger.log(`Wheel email sent successfully to ${Email}`);
                    }
                    catch (emailError) {
                        this.logger.error(`Failed to send wheel email to ${Email}:`, emailError);
                    }
                }
                else {
                    this.logger.warn(`No spins earned for amount ${payment.amount}, skipping session creation and email sending`);
                }
                return {
                    success: true,
                    message: spinsEarned > 0 ? 'Purchase processed successfully' : 'Purchase processed but no spins earned',
                    sessionId: session?.id || null,
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
        const { Email, Phone, payment } = data;
        if (!Email || typeof Email !== 'string') {
            throw new common_1.BadRequestException('Valid email is required');
        }
        if (Phone && typeof Phone !== 'string') {
            throw new common_1.BadRequestException('Phone must be a string if provided');
        }
        if (!payment || typeof Number(payment.amount) !== 'number' || Number(payment.amount) <= 0) {
            throw new common_1.BadRequestException('Valid amount is required');
        }
        if (!payment.orderid || typeof payment.orderid !== 'string') {
            throw new common_1.BadRequestException('Valid order_id is required');
        }
        if (payment.products && !Array.isArray(payment.products)) {
            throw new common_1.BadRequestException('Products must be an array if provided');
        }
        return { Email: Email, Phone: Phone, payment: payment };
    }
    calculateSpins(amount) {
        return Math.floor(amount / 50);
    }
    async findOrCreateUser(tx, email) {
        let user = await tx.users.findUnique({
            where: { email },
        });
        if (!user) {
            user = await tx.users.create({
                data: {
                    email
                },
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
                phone: orderData.phone,
                products: orderData.products,
                name: orderData.name,
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
    async sendWheelEmail(email) {
        try {
            const requestData = {
                action: 'issue.send',
                letter: {
                    message: {
                        html: this.WHEEL_EMAIL_HTML
                    },
                    subject: 'Колесо фортуны',
                    'from.email': 'mail@info.cake-school.com',
                    'from.name': 'Колесо фортуны'
                },
                group: 'personal',
                email: email,
                sendwhen: 'now'
            };
            const response = await axios_1.default.post(this.SENDSAY_API_URL, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'sendsay apikey=19mD7PhStSbesR1odSpR24Khd3-t_k0_-wkURlnXjWMrRitejwbu4staPSK-i5JKYjRwR6Opr',
                },
                timeout: 10000,
            });
            this.logger.log(`Sendsay API response for ${email}:`, response.data);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Error sending email to ${email}:`, error.response?.data || error.message);
            throw error;
        }
    }
};
exports.TildaService = TildaService;
exports.TildaService = TildaService = TildaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TildaService);
//# sourceMappingURL=tilda.service.js.map