"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminConfig = void 0;
const createAdminConfig = async (prismaService, configService) => {
    const AdminJS = (await import('adminjs')).default;
    const { Database, Resource } = await import('@adminjs/prisma');
    AdminJS.registerAdapter({ Database, Resource });
    return {
        adminJsOptions: {
            rootPath: '/admin',
            resources: [
                {
                    resource: { model: prismaService.users, client: prismaService },
                    options: {
                        listProperties: ['id', 'email', 'created_at'],
                        editProperties: ['email'],
                        filterProperties: ['email'],
                    },
                },
                {
                    resource: { model: prismaService.purchases, client: prismaService },
                    options: {
                        listProperties: ['id', 'order_id', 'amount', 'spins_earned', 'customer_email', 'created_at'],
                        editProperties: ['order_id', 'amount', 'spins_earned', 'customer_email'],
                        filterProperties: ['order_id', 'customer_email'],
                    },
                },
                {
                    resource: { model: prismaService.prizes, client: prismaService },
                    options: {
                        listProperties: ['id', 'name', 'total_quantity', 'quantity_remaining', 'type'],
                        editProperties: ['name', 'total_quantity', 'quantity_remaining', 'type'],
                        filterProperties: ['name', 'type'],
                    },
                },
                {
                    resource: { model: prismaService.spin_sessions, client: prismaService },
                    options: {
                        listProperties: ['id', 'spins_total', 'spins_used', 'is_active', 'created_at'],
                        editProperties: ['spins_total', 'spins_used', 'is_active'],
                    },
                },
                {
                    resource: { model: prismaService.spin_results, client: prismaService },
                    options: {
                        listProperties: ['id', 'status', 'created_at'],
                        editProperties: ['status'],
                        filterProperties: ['status'],
                    },
                },
                {
                    resource: { model: prismaService.email_queue, client: prismaService },
                    options: {
                        listProperties: ['id', 'subject', 'is_sent', 'send_after', 'sent_at'],
                        editProperties: ['subject', 'body', 'is_sent'],
                        filterProperties: ['is_sent'],
                    },
                },
            ],
        },
        auth: {
            authenticate: async (email, password) => {
                const adminEmail = configService.get('ADMIN_EMAIL');
                const adminPassword = configService.get('ADMIN_PASSWORD');
                if (email === adminEmail && password === adminPassword) {
                    return { email: adminEmail };
                }
                return null;
            },
            cookieName: 'adminjs',
            cookiePassword: configService.get('JWT_SECRET', 'admin-secret'),
        },
        sessionOptions: {
            resave: true,
            saveUninitialized: true,
            secret: configService.get('JWT_SECRET', 'admin-secret'),
        },
    };
};
exports.createAdminConfig = createAdminConfig;
//# sourceMappingURL=admin.config.js.map