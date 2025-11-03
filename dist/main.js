"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
    app.use((0, compression_1.default)({ level: 6 }));
    app.use((0, express_1.json)({ limit: '1mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '1mb' }));
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.getHttpAdapter().getInstance().set('etag', 'strong');
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
        maxAge: '30d',
        immutable: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Fortuna API')
        .setDescription('API для системы колеса фортуны с интеграцией Tilda и Sendsay')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const server = app.getHttpServer();
    if (server) {
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;
        server.requestTimeout = 0;
    }
    await app.listen(port);
    console.log(`Server started on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map