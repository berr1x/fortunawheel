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
var WheelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WheelService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const redis_service_1 = require("./redis.service");
const mandatory_prizes_service_1 = require("./mandatory-prizes.service");
const api_config_1 = require("../config/api.config");
const axios_1 = __importDefault(require("axios"));
let WheelService = WheelService_1 = class WheelService {
    constructor(prisma, redis, mandatoryPrizesService) {
        this.prisma = prisma;
        this.redis = redis;
        this.mandatoryPrizesService = mandatoryPrizesService;
        this.logger = new common_1.Logger(WheelService_1.name);
        this.SENDSAY_API_URL = 'https://api.sendsay.ru/general/api/v100/json/cakeschool';
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
                return {
                    success: false,
                    message: 'Пользователь не найден.',
                    sessionId: null,
                    spinsRemaining: 0,
                    spinsTotal: 0,
                };
            }
            const session = await tx.spin_sessions.findFirst({
                where: {
                    user_id: user.id,
                    is_active: true,
                },
            });
            if (session) {
                const wonPrizes = await this.getUserWonPrizes(email);
                return {
                    success: true,
                    message: 'Активная сессия найдена.',
                    sessionId: session.id.toString(),
                    spinsRemaining: session.spins_total - session.spins_used,
                    spinsTotal: session.spins_total,
                    wonPrizes: wonPrizes,
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
                const wonPrizes = await this.getUserWonPrizes(email);
                return {
                    success: true,
                    message: 'У вас нет доступных прокруток.',
                    sessionId: null,
                    spinsTotal: 0,
                    spinsRemaining: 0,
                    wonPrizes: wonPrizes,
                };
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
                const wonPrizes = await this.getUserWonPrizes(email);
                return {
                    success: true,
                    message: 'Все ваши прокруты уже использованы.',
                    sessionId: null,
                    spinsTotal: 0,
                    spinsRemaining: 0,
                    wonPrizes: wonPrizes,
                };
            }
            if (purchaseId) {
                const purchase = availablePurchases.find(p => p.id === purchaseId);
                if (!purchase) {
                    const wonPrizes = await this.getUserWonPrizes(email);
                    return {
                        success: true,
                        message: 'Указанная покупка не найдена или уже использована.',
                        sessionId: null,
                        spinsTotal: 0,
                        spinsRemaining: 0,
                        wonPrizes: wonPrizes,
                    };
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
                const wonPrizes = await this.getUserWonPrizes(email);
                return {
                    success: true,
                    message: 'Новая сессия создана.',
                    sessionId: newSession.id.toString(),
                    spinsTotal: newSession.spins_total,
                    spinsRemaining: newSession.spins_total - newSession.spins_used,
                    wonPrizes: wonPrizes,
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
            const wonPrizes = await this.getUserWonPrizes(email);
            return {
                success: true,
                message: 'Новая сессия создана.',
                sessionId: newSession.id.toString(),
                spinsTotal: newSession.spins_total,
                spinsRemaining: newSession.spins_total - newSession.spins_used,
                wonPrizes: wonPrizes,
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
                    number: 'asc',
                },
            });
            if (availablePrizes.length === 0) {
                throw new common_1.BadRequestException('Нет доступных призов');
            }
            const selectedPrize = await this.selectPrize(availablePrizes, session.results, session.spins_used, session.spins_total, tx);
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
            try {
                await this.sendPrizeEmail(session.user.email, spinResult.prize.name, this.getPrizeImageUrl(spinResult.prize.image));
                this.logger.log(`Prize email sent successfully to ${session.user.email} for prize: ${spinResult.prize.name}`);
            }
            catch (emailError) {
                this.logger.error(`Failed to send prize email to ${session.user.email}:`, emailError);
            }
            return {
                prize: spinResult.prize.name,
                success: true,
                prizeId: spinResult.prize.id,
                number: spinResult.prize.number,
                sessionId: sessionId,
                prizeImage: this.getPrizeImageUrl(spinResult.prize.image),
                spinsRemaining: session.spins_total - (session.spins_used + 1),
                spinsTotal: session.spins_total,
            };
        });
    }
    checkGuaranteedPrize(spinsUsed, spinsTotal, previousResults, availablePrizes) {
        if (spinsUsed < 5) {
            return null;
        }
        const guaranteedPrizes = availablePrizes.filter(prize => prize.type === 'guaranteed');
        if (guaranteedPrizes.length === 0) {
            return null;
        }
        const wonGuaranteedPrizeIds = previousResults
            .filter(result => guaranteedPrizes.some(gp => gp.id === result.prize_id))
            .map(result => result.prize_id);
        if (wonGuaranteedPrizeIds.length > 0) {
            return null;
        }
        const remainingSpins = spinsTotal - spinsUsed;
        if (remainingSpins === 1) {
            return guaranteedPrizes[0];
        }
        if (remainingSpins === 2) {
            return guaranteedPrizes[0];
        }
        return null;
    }
    async selectPrize(availablePrizes, previousResults, spinsUsed, spinsTotal, tx) {
        const wonPrizeIds = previousResults.map(result => result.prize_id);
        const guaranteedPrize = this.checkGuaranteedPrize(spinsUsed, spinsTotal, previousResults, availablePrizes);
        if (guaranteedPrize) {
            return guaranteedPrize;
        }
        const mandatoryPrizes = await this.getMandatoryPrizes(tx);
        const abundantPrizes = availablePrizes.filter(prize => prize.type === 'many' || prize.quantity_remaining > 1000);
        const limitedPrizes = availablePrizes.filter(prize => prize.type === 'limited' || (prize.quantity_remaining >= 100 && prize.quantity_remaining <= 999));
        const rarePrizes = availablePrizes.filter(prize => prize.type === 'rare' || prize.quantity_remaining <= 10);
        const restrictedPrizes = availablePrizes.filter(prize => prize.quantity_remaining < 20);
        if (spinsUsed < 4) {
            const unclaimedPrizes = availablePrizes.filter(prize => !wonPrizeIds.includes(prize.id));
            if (unclaimedPrizes.length > 0) {
                const unclaimedMandatory = unclaimedPrizes.filter(prize => mandatoryPrizes.some(mp => mp.prize.id === prize.id));
                if (unclaimedMandatory.length > 0) {
                    return this.selectRandomPrize(unclaimedMandatory);
                }
                return await this.selectPrizeByDistribution(unclaimedPrizes, wonPrizeIds, previousResults, spinsUsed + 1, tx);
            }
        }
        if (spinsUsed >= 4) {
            const availableMandatory = availablePrizes.filter(prize => mandatoryPrizes.some(mp => mp.prize.id === prize.id));
            if (availableMandatory.length > 0) {
                if (Math.random() < 0.7) {
                    return this.selectRandomPrize(availableMandatory);
                }
            }
            return await this.selectPrizeByDistribution(availablePrizes, wonPrizeIds, previousResults, spinsUsed + 1, tx);
        }
        return this.selectRandomPrize(availablePrizes);
    }
    async selectPrizeByDistribution(availablePrizes, wonPrizeIds, previousResults, spinNumber, tx) {
        const distributionStats = await this.getPrizeDistributionStats(60, tx);
        const abundantPrizes = availablePrizes.filter(prize => prize.type === 'many' || prize.quantity_remaining > 1000);
        const limitedPrizes = availablePrizes.filter(prize => prize.type === 'limited' || (prize.quantity_remaining >= 100 && prize.quantity_remaining <= 999));
        const rarePrizes = availablePrizes.filter(prize => prize.type === 'rare' || prize.quantity_remaining <= 10);
        const restrictedPrizes = availablePrizes.filter(prize => prize.quantity_remaining < 20);
        const availableRestricted = restrictedPrizes.filter(prize => !wonPrizeIds.includes(prize.id));
        const filteredAbundant = abundantPrizes.filter(prize => !restrictedPrizes.some(rp => rp.id === prize.id));
        const filteredLimited = limitedPrizes.filter(prize => !restrictedPrizes.some(rp => rp.id === prize.id));
        const filteredRare = rarePrizes.filter(prize => !restrictedPrizes.some(rp => rp.id === prize.id));
        const abundantWithLimits = this.filterPrizesByRepetitionLimits(filteredAbundant, previousResults, spinNumber, false);
        const limitedWithLimits = this.filterPrizesByRepetitionLimits(filteredLimited, previousResults, spinNumber, false);
        const rareWithLimits = this.filterPrizesByRepetitionLimits(filteredRare, previousResults, spinNumber, true);
        const random = Math.random();
        if (random < 0.95 && abundantWithLimits.length > 0) {
            return await this.selectWeightedPrizeWithStats(abundantWithLimits, distributionStats, tx);
        }
        else if (random < 0.999 && limitedWithLimits.length > 0) {
            return await this.selectWeightedPrizeWithStats(limitedWithLimits, distributionStats, tx);
        }
        else if (random < 1.0 && rareWithLimits.length > 0) {
            return await this.selectWeightedPrizeWithStats(rareWithLimits, distributionStats, tx);
        }
        else if (availableRestricted.length > 0) {
            return await this.selectWeightedPrizeWithStats(availableRestricted, distributionStats, tx);
        }
        else {
            return this.selectRandomPrize(availablePrizes);
        }
    }
    getMaxAllowedRepetitions(spinNumber) {
        if (spinNumber <= 9) {
            return 2;
        }
        else {
            return 3;
        }
    }
    countPrizeRepetitions(prizeId, previousResults) {
        return previousResults.filter(result => result.prize_id === prizeId).length;
    }
    filterPrizesByRepetitionLimits(prizes, previousResults, spinNumber, isRare = false) {
        if (isRare) {
            const lastPrize = previousResults[previousResults.length - 1];
            const wasLastPrizeRare = lastPrize && prizes.some(p => p.id === lastPrize.prize_id);
            if (wasLastPrizeRare) {
                return [];
            }
            const rarePrizeCount = previousResults.filter(result => prizes.some(p => p.id === result.prize_id)).length;
            const maxRarePer50Spins = Math.floor(spinNumber / 50);
            if (rarePrizeCount >= maxRarePer50Spins) {
                return [];
            }
            const recentRareCount = previousResults.slice(-20).filter(result => prizes.some(p => p.id === result.prize_id)).length;
            if (recentRareCount > 0) {
                return [];
            }
            return prizes;
        }
        const maxRepetitions = this.getMaxAllowedRepetitions(spinNumber);
        return prizes.filter(prize => {
            const repetitions = this.countPrizeRepetitions(prize.id, previousResults);
            return repetitions <= maxRepetitions;
        });
    }
    async getPrizeDistributionStats(minutes = 60, tx) {
        const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
        const results = await tx.spin_results.findMany({
            where: {
                created_at: {
                    gte: cutoffTime,
                },
            },
            select: {
                prize_id: true,
            },
        });
        const stats = new Map();
        results.forEach(result => {
            const count = stats.get(result.prize_id) || 0;
            stats.set(result.prize_id, count + 1);
        });
        return stats;
    }
    calculateDynamicWeight(prize, distributionStats, totalUsersEstimate = 2000) {
        let weight = prize.quantity_remaining;
        const issuedCount = distributionStats.get(prize.id) || 0;
        const issuedPercentage = prize.total_quantity > 0 ?
            (issuedCount / prize.total_quantity) : 0;
        let expectedPercentage = 0;
        if (prize.type === 'rare' || prize.quantity_remaining <= 10) {
            expectedPercentage = 0.0001;
        }
        else if (prize.type === 'limited' || (prize.quantity_remaining >= 100 && prize.quantity_remaining <= 999)) {
            expectedPercentage = 0.01;
        }
        else {
            expectedPercentage = 0.08;
        }
        if (issuedPercentage > expectedPercentage * 2) {
            weight *= 0.01;
        }
        else if (issuedPercentage > expectedPercentage * 1.5) {
            weight *= 0.1;
        }
        else if (issuedPercentage > expectedPercentage) {
            weight *= 0.5;
        }
        if (prize.type === 'many') {
            weight *= 1.5;
        }
        else if (prize.type === 'limited') {
            weight *= 1.0;
        }
        else if (prize.type === 'rare') {
            weight *= 0.001;
        }
        if (prize.quantity_remaining <= 5) {
            weight *= 0.0001;
        }
        else if (prize.quantity_remaining <= 10) {
            weight *= 0.001;
        }
        else if (prize.quantity_remaining <= 20) {
            weight *= 0.01;
        }
        const recentIssued = distributionStats.get(prize.id) || 0;
        if (recentIssued > 0) {
            weight *= Math.pow(0.1, recentIssued);
        }
        return Math.max(weight, 0.001);
    }
    async selectWeightedPrizeWithStats(prizes, distributionStats, tx) {
        if (prizes.length === 0) {
            throw new Error('Нет призов для выбора');
        }
        if (prizes.length === 1) {
            return prizes[0];
        }
        const weights = prizes.map(prize => this.calculateDynamicWeight(prize, distributionStats));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        for (let i = 0; i < prizes.length; i++) {
            currentWeight += weights[i];
            if (random <= currentWeight) {
                return prizes[i];
            }
        }
        return prizes[prizes.length - 1];
    }
    selectWeightedPrize(prizes) {
        if (prizes.length === 0) {
            throw new Error('Нет призов для выбора');
        }
        if (prizes.length === 1) {
            return prizes[0];
        }
        const weights = prizes.map(prize => {
            let weight = prize.quantity_remaining;
            if (prize.type === 'many') {
                weight *= 1.5;
            }
            else if (prize.type === 'limited') {
                weight *= 1.0;
            }
            else if (prize.type === 'rare') {
                weight *= 0.08;
            }
            if (prize.quantity_remaining <= 5) {
                weight *= 0.01;
            }
            else if (prize.quantity_remaining <= 10) {
                weight *= 0.04;
            }
            return Math.max(weight, 0.01);
        });
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        for (let i = 0; i < prizes.length; i++) {
            currentWeight += weights[i];
            if (random <= currentWeight) {
                return prizes[i];
            }
        }
        return prizes[prizes.length - 1];
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
            orderBy: {
                number: 'asc',
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
    createPrizeEmailHTML(prizeName, prizeImage) {
        const imageHtml = prizeImage
            ? `<img src="${prizeImage}" alt="${prizeName}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 15px; margin: 20px 0;" />`
            : '';
        return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Поздравляем! Вы выиграли приз!</title>
    <style>
        body {
            font-family: Inter, sans-serif;
            background-color: #EDEDED;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #EDEDED;
            padding: 4%;
        }
        .prize-card {
            background-color: #CBB395;
            padding: 2em;
            border-radius: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .prize-title {
            font-size: 2rem;
            font-weight: bold;
            color: black;
            margin: 20px 0;
        }
        .prize-name {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2c3e50;
            margin: 20px 0;
        }
        .congratulations {
            font-size: 1.2rem;
            color: black;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
        }
        .footer p {
            font-size: 1.2rem;
            color: #000;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="prize-card">
            <h1 class="prize-title">🎉 Поздравляем! 🎉</h1>
            <p class="congratulations">Вы выиграли приз в колесе фортуны!</p>
            <div class="prize-name">${prizeName}</div>
            ${imageHtml}
            <p class="congratulations">Спасибо за участие в акции Cake School!</p>
        </div>
        
        <div class="footer">
            <p>С любовью, команда Cake School</p>
            <p><a href="https://cake-school.com" style="color: #CBB395;">cake-school.com</a></p>
        </div>
    </div>
</body>
</html>`;
    }
    formatDateForSendsay(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    async sendPrizeEmail(email, prizeName, prizeImage) {
        try {
            const sendTime = new Date();
            sendTime.setMinutes(sendTime.getMinutes() + 5);
            const requestData = {
                action: 'issue.send',
                letter: {
                    message: {
                        html: this.createPrizeEmailHTML(prizeName, prizeImage)
                    },
                    subject: 'Поздравляем! Вы выиграли приз!',
                    'from.email': 'mail@cake-school.com',
                    'from.name': 'Колесо фортуны'
                },
                group: 'personal',
                email: email,
                sendwhen: 'now',
            };
            const response = await axios_1.default.post(this.SENDSAY_API_URL, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'sendsay apikey=19mD7PhStSbesR1odSpR24Khd3-t_k0_-wkURlnXjWMrRitejwbu4staPSK-i5JKYjRwR6Opr',
                },
                timeout: 10000,
            });
            this.logger.log(`Prize email scheduled for ${email} at ${this.formatDateForSendsay(sendTime)}:`, response.data);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Error sending prize email to ${email}:`, error.response?.data || error.message);
            throw error;
        }
    }
};
exports.WheelService = WheelService;
exports.WheelService = WheelService = WheelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        mandatory_prizes_service_1.MandatoryPrizesService])
], WheelService);
//# sourceMappingURL=wheel.service.js.map