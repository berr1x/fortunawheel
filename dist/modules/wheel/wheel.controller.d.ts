import { WheelService, SpinResult } from '../../services/wheel.service';
export declare class WheelController {
    private wheelService;
    constructor(wheelService: WheelService);
    getSession(email: string): Promise<{
        sessionId: string;
        spinsRemaining: number;
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        sessionId: any;
        spinsRemaining: number;
    }>;
    spin(sessionId: string): Promise<SpinResult>;
    getPrizes(): Promise<any[]>;
    getWonPrizes(email: string): Promise<{
        success: boolean;
        prizes: {
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
        totalCount: number;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        prizes: any[];
        totalCount: number;
    }>;
}
