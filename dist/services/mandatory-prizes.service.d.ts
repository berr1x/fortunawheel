import { PrismaService } from './prisma.service';
export interface MandatoryPrize {
    id: number;
    prize_id: number;
    target_quantity: number;
    issued_quantity: number;
    period_start: Date;
    period_end: Date;
    is_active: boolean;
    prize: {
        id: number;
        name: string;
        quantity_remaining: number;
        image: string | null;
    };
}
export declare class MandatoryPrizesService {
    private prisma;
    constructor(prisma: PrismaService);
    private getPrizeImageUrl;
    createMandatoryPrize(prizeId: number, targetQuantity: number): Promise<MandatoryPrize>;
    getActiveMandatoryPrizes(): Promise<MandatoryPrize[]>;
    incrementIssuedQuantity(mandatoryPrizeId: number): Promise<MandatoryPrize>;
    shouldIssueMandatoryPrize(mandatoryPrize: MandatoryPrize): boolean;
    getPriorityMandatoryPrizes(): Promise<MandatoryPrize[]>;
    deactivateExpiredPeriods(): Promise<number>;
    createDailyMandatoryPrizes(): Promise<void>;
}
