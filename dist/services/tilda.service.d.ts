import { PrismaService } from './prisma.service';
export declare class TildaService {
    private prisma;
    private readonly logger;
    private readonly SENDSAY_API_URL;
    private readonly WHEEL_EMAIL_HTML;
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
    }>;
    private validateWebhookData;
    private calculateSpins;
    private findOrCreateUser;
    private createPurchase;
    private createSpinSession;
    private sendWheelEmail;
}
