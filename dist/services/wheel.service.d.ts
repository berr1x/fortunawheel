import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { MandatoryPrizesService } from './mandatory-prizes.service';
interface Prize {
    id: number;
    name: string;
    total_quantity: number;
    quantity_remaining: number;
    type: string | null;
    image: string | null;
    number: number;
}
export interface SpinResult {
    prize: string;
    success: boolean;
    prizeId?: number;
    sessionId?: string;
    prizeImage?: string | null;
    spinsRemaining?: number;
    spinsTotal?: number;
}
export declare class WheelService {
    private prisma;
    private redis;
    private mandatoryPrizesService;
    private readonly logger;
    private readonly SENDSAY_API_URL;
    constructor(prisma: PrismaService, redis: RedisService, mandatoryPrizesService: MandatoryPrizesService);
    private getPrizeImageUrl;
    createOrGetSession(email: string, purchaseId?: number): Promise<{
        success: boolean;
        message: string;
        sessionId: any;
        spinsRemaining: number;
        spinsTotal: number;
        wonPrizes?: undefined;
    } | {
        success: boolean;
        message: string;
        sessionId: string;
        spinsRemaining: number;
        spinsTotal: number;
        wonPrizes: {
            id: number;
            prize: {
                id: number;
                name: string;
                type: string;
                image: string;
            };
            session: {
                id: number;
                createdAt: Date;
            };
            purchase: {
                id: number;
                orderId: string;
                amount: number;
                createdAt: Date;
            };
            status: string;
            wonAt: Date;
        }[];
    }>;
    spinWheel(sessionId: string): Promise<SpinResult>;
    private selectPrize;
    private getMandatoryPrizes;
    private selectRandomPrize;
    getAvailablePrizes(): Promise<Prize[]>;
    getUserWonPrizes(email: string): Promise<{
        id: number;
        prize: {
            id: number;
            name: string;
            type: string;
            image: string;
        };
        session: {
            id: number;
            createdAt: Date;
        };
        purchase: {
            id: number;
            orderId: string;
            amount: number;
            createdAt: Date;
        };
        status: string;
        wonAt: Date;
    }[]>;
    private createPrizeEmailHTML;
    private formatDateForSendsay;
    private sendPrizeEmail;
}
export {};
