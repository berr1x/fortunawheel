import { PrismaService } from './prisma.service';
export declare class TildaService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processPurchase(webhookData: any): Promise<{
        success: boolean;
        message: string;
        sessionId: any;
        spinsEarned: number;
        userId: any;
    } | {
        success: boolean;
        message: string;
        spinsEarned: number;
    }>;
    private validateWebhookData;
    private calculateSpins;
    private findOrCreateUser;
    private createPurchase;
    private createSpinSession;
}
