import { PrismaService } from '../services/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUsers(search?: string): Promise<{
        id: number;
        email: string;
        created_at: Date;
        totalPurchaseAmount: number;
        totalSpinsEarned: number;
        totalSpinsUsed: number;
        spinsRemaining: number;
        wonPrizes: {
            id: number;
            name: string;
            type: string;
            count: number;
        }[];
        purchasesCount: number;
        sessionsCount: number;
    }[]>;
    getUserById(userId: number): Promise<{
        id: number;
        email: string;
        created_at: Date;
        totalPurchaseAmount: number;
        totalSpinsEarned: number;
        totalSpinsUsed: number;
        spinsRemaining: number;
        wonPrizes: {
            id: number;
            name: string;
            type: string;
            count: number;
        }[];
        purchasesCount: number;
        sessionsCount: number;
    }>;
    createUser(data: {
        email: string;
        phone?: string;
        purchaseAmount?: number;
        spinsCount?: number;
    }): Promise<{
        created_at: Date;
        id: number;
        email: string;
    }>;
    updateUser(userId: number, data: {
        email?: string;
        purchaseAmount?: number;
        spinsCount?: number;
    }): Promise<{
        message: string;
    }>;
    getPrizes(): Promise<{
        number: number;
        type: string | null;
        id: number;
        name: string;
        total_quantity: number;
        quantity_remaining: number;
        image: string | null;
        from_color: string | null;
        to_color: string | null;
        between_color: string | null;
        text_color: string | null;
        rotation: number | null;
    }[]>;
    createPrize(data: {
        name: string;
        total_quantity: number;
        quantity_remaining: number;
        type?: string;
        image?: string;
        from_color?: string;
        to_color?: string;
        between_color?: string;
        text_color?: string;
        number: number;
    }): Promise<{
        number: number;
        type: string | null;
        id: number;
        name: string;
        total_quantity: number;
        quantity_remaining: number;
        image: string | null;
        from_color: string | null;
        to_color: string | null;
        between_color: string | null;
        text_color: string | null;
        rotation: number | null;
    }>;
    updatePrize(prizeId: number, data: {
        name?: string;
        total_quantity?: number;
        quantity_remaining?: number;
        type?: string;
        image?: string;
        from_color?: string;
        to_color?: string;
        between_color?: string;
        text_color?: string;
        number?: number;
    }): Promise<{
        number: number;
        type: string | null;
        id: number;
        name: string;
        total_quantity: number;
        quantity_remaining: number;
        image: string | null;
        from_color: string | null;
        to_color: string | null;
        between_color: string | null;
        text_color: string | null;
        rotation: number | null;
    }>;
    deletePrize(prizeId: number): Promise<{
        message: string;
    }>;
    updatePrizeQuantity(prizeId: number, quantity: number, type: string): Promise<{
        number: number;
        type: string | null;
        id: number;
        name: string;
        total_quantity: number;
        quantity_remaining: number;
        image: string | null;
        from_color: string | null;
        to_color: string | null;
        between_color: string | null;
        text_color: string | null;
        rotation: number | null;
    }>;
    getMandatoryPrizes(): Promise<({
        prize: {
            type: string;
            id: number;
            name: string;
            image: string;
        };
    } & {
        target_quantity: number;
        issued_quantity: number;
        period_start: Date;
        period_end: Date;
        is_active: boolean;
        created_at: Date;
        id: number;
        prize_id: number;
    })[]>;
    createMandatoryPrize(data: {
        prize_id: number;
        target_quantity: number;
        period_start: Date;
        period_end: Date;
    }): Promise<{
        target_quantity: number;
        issued_quantity: number;
        period_start: Date;
        period_end: Date;
        is_active: boolean;
        created_at: Date;
        id: number;
        prize_id: number;
    }>;
    updateMandatoryPrize(mandatoryPrizeId: number, data: {
        prize_id?: number;
        target_quantity?: number;
        period_start?: Date;
        period_end?: Date;
        is_active?: boolean;
    }): Promise<{
        target_quantity: number;
        issued_quantity: number;
        period_start: Date;
        period_end: Date;
        is_active: boolean;
        created_at: Date;
        id: number;
        prize_id: number;
    }>;
    deleteMandatoryPrize(mandatoryPrizeId: number): Promise<{
        message: string;
    }>;
    getPurchasesData(search?: string): Promise<{
        name: string;
        phone: string;
        email: string;
        product: string;
        amount: number;
        spinsEarned: number;
        createdAt: Date;
    }[]>;
    getSpinsData(search?: string): Promise<{
        name: string;
        phone: string;
        email: string;
        purchaseAmount: number;
        totalSpins: number;
        spinsRemaining: number;
        wonPrizes: string;
        products: string | number | true | import("generated/prisma/runtime/library").JsonObject;
        createdAt: Date;
    }[]>;
    private autoFitColumns;
    exportPurchasesToExcel(): Promise<any>;
    exportSpinsToExcel(): Promise<any>;
}
