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
}
export interface SpinResult {
    prize: string;
    success: boolean;
    prizeId?: number;
    sessionId?: string;
    prizeImage?: string | null;
}
export declare class WheelService {
    private prisma;
    private redis;
    private mandatoryPrizesService;
    constructor(prisma: PrismaService, redis: RedisService, mandatoryPrizesService: MandatoryPrizesService);
    private getPrizeImageUrl;
    createOrGetSession(email: string, purchaseId?: number): Promise<{
        sessionId: string;
        spinsRemaining: number;
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
}
export {};
