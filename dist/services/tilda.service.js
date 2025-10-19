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
let TildaService = TildaService_1 = class TildaService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TildaService_1.name);
        this.SENDSAY_API_URL = 'https://api.sendsay.ru/general/api/v100/json/cakeschool';
        this.WHEEL_EMAIL_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Письмо Cake School</title>
	 <style>
        /* Общие стили */
        body {
            font-family: Inter, sans-serif;
            background-color: #EDEDED;
            margin: 0;
            padding: 0;
        }

        h1, p, ul li {
            font-size: 1.2rem; /* Установка размера в rem */
        }

        /* Медиа-запросы для небольших экранов (мобильные устройства) */
        @media only screen and (max-width: 600px) {
            h1, p, ul li {
                font-size: 1.2rem; /* Уменьшение шрифтов для маленьких экранов */
            }
            .cta-button {
                font-size: 1.2rem;
            }
        }

        /* Медиа-запросы для средних экранов (планшеты) */
        @media only screen and (max-width: 768px) {
            h1, p, ul li {
                font-size: 1.4rem; /* Подстройка шрифтов для планшетов */
            }
        }
	</style></head><body style="font-family: Inter, sans-serif; background-color: #EDEDED; margin: 0; padding: 0;">

<div class="container" style="max-width: 600px; margin: 0 auto; background-color: #EDEDED; padding: 4%;">

    <div class="header" style="text-align: center;">

		<img src="https://sun9-28.userapi.com/impg/fa_O0d4uRLsYsZqOtpsO1HnTBoOCmdIGVACr5A/gVg-93_e-fc.jpg?size=1100x476&quality=95&sign=5c6e6f9c8fd35a318d644cdc4d72ee00&type=album" style="width: 100%;border-radius:23px;vertical-align: bottom;" />

    </div>

<div class="banana" style="box-sizing: border-box;width: 100%; background-color: #CBB395; padding: 1em 2em 1.5em; margin-left: 0px; margin-top: 7px; border-radius: 20px;">
      <p style="font-size: 1.4rem; font-weight: bold; color: black;">Испытайте удачу в беспроигрышном колесе фортуны от Cake School 🎁</p>
			<p style="font-size: 1.1rem; color: black!important;">Больше 1000 гарантированных призов ждут вас!
</p>
	<a class="cta-button" href="https://cake-school-fortuna.com/" style="display: block; text-align: center; background-color: black; color: #CBB395; padding: 0.8em; text-decoration: none; border-radius: 50px; font-size: 1.1rem; margin: 1.4em 0; text-transform: uppercase; font-weight: bold;">Крутить колесо</a>
		<p style="font-size: 1.4rem; font-weight: bold; color: black;">Важно!</p>
			<p style="font-size: 1.1rem; color: black!important;">Колесо Фортуны – рандомный розыгрыш подарков. Перекрутить колесо будет нельзя, даже если у вас уже есть такой подарок.</p>

		</div>

    <div class="footer" style="text-align: center; margin-top: 40px;">
      <p style="text-transform: uppercase; font-size: 1.5rem; margin: 20px 0; text-align: center;color:#000;"><strong>Мы на связи</strong></p>
      <div class="social-icons" style="text-align: center; margin: 20px 0;">
       <a href="https://youtube.com/@cake_school?feature=shared"><img src="https://sun9-50.userapi.com/impg/Ovi3PGEaA40e8MZwdPesT4Es5BA9x_38RKv_LQ/6jyPcEV-WEE.jpg?size=56x57&quality=95&sign=ed7ce052e9ba099089e187549a33126c&type=album" alt="YouTube" style="width: 58px; border-radius:50%;" /></a>
        <a href="https://www.instagram.com/cake_school"> <img src="https://sun9-65.userapi.com/impg/5-DyvQq1D8ZmOQwSBcDnvQwFlvIemBLMvAImoQ/YBhhrHVsAF0.jpg?size=57x57&quality=95&sign=60d5b21401864e9b11284999b0a00887&type=album" alt="Instagram" style="width: 58px; border-radius:50%;" /></a>
         <a href="https://vk.com/kursy_konditera"><img src="https://sun9-19.userapi.com/impg/4MrVeLeS-A9qufcmIAJ14FvVwmlnaiIkuWL7DQ/OOqDI1gKjAI.jpg?size=57x57&quality=95&sign=dced4650d473af8e9ef334ad1db31cff&type=album" alt="VK" style="width: 58px; border-radius:50%;" /></a>
         <a href="https://t.me/cake_school"><img src="https://sun9-28.userapi.com/impg/VFswXHiihMMP8jQYiCUYMYhZvBv3ffCTa6QoMQ/cvQhPorNYQA.jpg?size=56x57&quality=95&sign=174f354878e4cfee47d19e38e940268d&type=album" alt="Telegram" style="width: 58px; border-radius:50%;" /></a>
        <a href="https://api.whatsapp.com/send?phone=79384418742"> <img src="https://sun1-97.userapi.com/impg/VCXPSTESRS1KT_J8aBLjGUHiZQ6u3sPDpbtO5A/rkx3khBkKcc.jpg?size=57x57&quality=95&sign=a896ac1a676fa055bc5955572eed7245&type=album" alt="WhatsApp" style="width: 58px; border-radius:50%;" /></a>
      </div>
      <hr style="border: 1px solid white; margin: 50px 0;" />
      <img style="width: 100px;" src="https://bryandaby.ru/wp-content/uploads/2024/10/12.png" alt="ava" />
      <p style="font-size: 1.2rem;color:#000;">С любовью, Алина Макарова<br><a href="https://cake-school.com" style="color: #CBB395;">cake-school.com</a></p>
    </div>

</div>

</body></html>`;
    }
    async processPurchase(webhookData) {
        try {
            const { Email, payment } = webhookData;
            if (!Email || !payment || !payment.amount || !payment.orderid) {
                return {
                    success: false,
                    message: 'Invalid webhook data',
                };
            }
            const spinsEarned = this.calculateSpins(Number(payment.amount));
            this.logger.log(`Processing purchase: email=${Email}, amount=${payment.amount}, spins=${spinsEarned}`);
            return await this.prisma.$transaction(async (tx) => {
                const user = await this.findOrCreateUser(tx, Email);
                const purchase = await this.createPurchase(tx, user.id, {
                    order_id: payment.orderid,
                    amount: Number(payment.amount),
                    spins_earned: spinsEarned,
                    customer_email: Email,
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
        const { Email, payment } = data;
        if (!Email || typeof Email !== 'string') {
            throw new common_1.BadRequestException('Valid email is required');
        }
        if (!payment || typeof Number(payment.amount) !== 'number' || Number(payment.amount) <= 0) {
            throw new common_1.BadRequestException('Valid amount is required');
        }
        if (!payment.orderid || typeof payment.orderid !== 'string') {
            throw new common_1.BadRequestException('Valid order_id is required');
        }
        return { Email: Email, payment: payment };
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
    async sendWheelEmail(email) {
        try {
            const requestData = {
                action: 'issue.send',
                letter: {
                    message: {
                        html: this.WHEEL_EMAIL_HTML
                    },
                    subject: 'Колесо фортуны',
                    'from.email': 'mail@cake-school.com',
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