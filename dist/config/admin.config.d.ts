import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../services/prisma.service';
export declare const createAdminConfig: (prismaService: PrismaService, configService: ConfigService) => Promise<{
    adminJsOptions: {
        rootPath: string;
        resources: ({
            resource: {
                model: import("generated/prisma").Prisma.usersDelegate<import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
                client: PrismaService;
            };
            options: {
                listProperties: string[];
                editProperties: string[];
                filterProperties: string[];
            };
        } | {
            resource: {
                model: import("generated/prisma").Prisma.purchasesDelegate<import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
                client: PrismaService;
            };
            options: {
                listProperties: string[];
                editProperties: string[];
                filterProperties: string[];
            };
        } | {
            resource: {
                model: import("generated/prisma").Prisma.prizesDelegate<import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
                client: PrismaService;
            };
            options: {
                listProperties: string[];
                editProperties: string[];
                filterProperties: string[];
            };
        } | {
            resource: {
                model: import("generated/prisma").Prisma.spin_sessionsDelegate<import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
                client: PrismaService;
            };
            options: {
                listProperties: string[];
                editProperties: string[];
                filterProperties?: undefined;
            };
        } | {
            resource: {
                model: import("generated/prisma").Prisma.spin_resultsDelegate<import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
                client: PrismaService;
            };
            options: {
                listProperties: string[];
                editProperties: string[];
                filterProperties: string[];
            };
        } | {
            resource: {
                model: import("generated/prisma").Prisma.email_queueDelegate<import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
                client: PrismaService;
            };
            options: {
                listProperties: string[];
                editProperties: string[];
                filterProperties: string[];
            };
        })[];
    };
    auth: {
        authenticate: (email: string, password: string) => Promise<{
            email: any;
        }>;
        cookieName: string;
        cookiePassword: any;
    };
    sessionOptions: {
        resave: boolean;
        saveUninitialized: boolean;
        secret: any;
    };
}>;
