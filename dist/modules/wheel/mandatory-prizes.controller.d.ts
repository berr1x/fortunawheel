import { MandatoryPrizesService } from '../../services/mandatory-prizes.service';
export declare class MandatoryPrizesController {
    private mandatoryPrizesService;
    constructor(mandatoryPrizesService: MandatoryPrizesService);
    getActiveMandatoryPrizes(): Promise<import("../../services/mandatory-prizes.service").MandatoryPrize[]>;
    getPriorityMandatoryPrizes(): Promise<import("../../services/mandatory-prizes.service").MandatoryPrize[]>;
    createMandatoryPrize(body: {
        prizeId: number;
        targetQuantity: number;
    }): Promise<import("../../services/mandatory-prizes.service").MandatoryPrize>;
    createDailyMandatoryPrizes(): Promise<{
        message: string;
    }>;
    deactivateExpiredPeriods(): Promise<{
        message: string;
    }>;
}
