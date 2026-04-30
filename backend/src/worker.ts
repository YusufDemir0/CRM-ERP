import './telemetry';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from 'nestjs-pino';

/**
 * Worker Entry Point — Background job processor.
 * 
 * This is a SEPARATE process from the API (main.ts).
 * It runs CRON jobs and processes Outbox events.
 * It does NOT start an HTTP server.
 * 
 * Usage:
 *   node dist/worker.js
 * 
 * Docker:
 *   CMD ["node", "dist/worker.js"]
 */
async function bootstrapWorker() {
  // createApplicationContext → No HTTP server, just DI container
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  // Graceful shutdown
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
