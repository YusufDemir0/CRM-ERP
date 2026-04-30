"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./telemetry");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const nestjs_pino_1 = require("nestjs-pino");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
        bufferLogs: true,
    });
    const logger = app.get(nestjs_pino_1.Logger);
    app.useLogger(logger);
    const configService = app.get(config_1.ConfigService);
    app.setGlobalPrefix('api');
    app.use((0, helmet_1.default)());
    logger.log('✅ Helmet security headers enabled');
    app.use((0, compression_1.default)());
    logger.log('✅ Response compression enabled');
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.use((0, cookie_parser_1.default)());
    const allowedOriginsRaw = configService.get('ALLOWED_ORIGINS');
    const allowedOrigins = allowedOriginsRaw
        ? allowedOriginsRaw.split(',').map(o => o.trim())
        : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5143'];
    app.enableCors({
        origin: allowedOrigins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        exposedHeaders: ['X-CSRF-TOKEN'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalInterceptors(new common_1.ClassSerializerInterceptor(app.get(core_1.Reflector)));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.enableShutdownHooks();
    logger.log('✅ Graceful shutdown hooks enabled');
    const port = configService.get('APP_PORT') || 5143;
    await app.listen(port);
    logger.log(`🚀 ERP Backend API running on http://localhost:${port}/api`);
    logger.log(`📊 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map