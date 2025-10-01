import { ConfigService } from '@nestjs/config';
export declare class SendsayService {
    private configService;
    private apiUrl;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, body: string): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
}
