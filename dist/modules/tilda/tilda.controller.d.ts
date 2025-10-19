import { TildaService } from '../../services/tilda.service';
export declare class TildaController {
    private tildaService;
    private readonly logger;
    constructor(tildaService: TildaService);
    webhook(body: any, headers: Record<string, string>): Promise<{
        success: boolean;
        message: string;
        sessionId: any;
        spinsEarned: number;
        userId: any;
    } | {
        success: boolean;
        message: string;
    }>;
}
