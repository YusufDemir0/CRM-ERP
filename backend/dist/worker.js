"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./telemetry");
const core_1 = require("@nestjs/core");
const worker_module_1 = require("./worker.module");
const nestjs_pino_1 = require("nestjs-pino");
async function bootstrapWorker() {
    const app = await core_1.NestFactory.createApplicationContext(worker_module_1.WorkerModule, {
        bufferLogs: true,
    });
    const logger = app.get(nestjs_pino_1.Logger);
    app.useLogger(logger);
    app.enableShutdownHooks();
    process.on('SIGTERM', async () => {
        logger.log('SIGTERM received. Shutting down worker gracefully...');
        await app.close();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        logger.log('SIGINT received. Shutting down worker gracefully...');
        await app.close();
        process.exit(0);
    });
    logger.log('🔧 Ermay ERP Worker started. Listening for scheduled jobs...');
}
bootstrapWorker();
//# sourceMappingURL=worker.js.map