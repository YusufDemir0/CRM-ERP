import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { OutboxEvent, OutboxStatus } from '../entities/outbox-event.entity';
import { RabbitMQService } from './rabbitmq.service';
import dayjs from 'dayjs';

/**
 * OutboxWorker — Polls the outbox table and publishes events to RabbitMQ.
 * 
 * ENTERPRISE ARCHITECTURE:
 *   - Runs in a SEPARATE process (worker.ts), NOT in the API process
 *   - Uses SELECT ... FOR UPDATE SKIP LOCKED for multi-replica safety
 *   - Multiple workers can run simultaneously without processing the same event
 *   - Publisher confirms ensure RabbitMQ received the message before marking as processed
 *   - Failed events go to Dead Letter Queue after 5 attempts
 * 
 * DUPLICATION PREVENTION:
 *   RabbitMQ publish MUST happen OUTSIDE the DB transaction to prevent
 *   the scenario where messages are published but transaction rolls back,
 *   causing the same messages to be re-published on the next poll cycle.
 * 
 * Flow: DB (outbox_events) → Worker → RabbitMQ (durable) → Consumers
 */
@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);
  private isProcessing = false;

  /** Stale event timeout: events stuck in PROCESSING for > 5 minutes are reset */
  private static readonly STALE_TIMEOUT_MS = 5 * 60 * 1000;

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  /**
   * Poll outbox table every 10 seconds.
   * SKIP LOCKED ensures multiple workers don't fight over the same rows.
   * 
   * Three-phase commit pattern:
   *   Phase 1: Lock rows & mark as PROCESSING (DB transaction — committed)
   *   Phase 2: Publish to RabbitMQ (external side-effect — NO DB transaction)
   *   Phase 3: Update status to PROCESSED or retry (DB update)
   */
  @Cron('*/2 * * * * *')
  async handleOutbox() {
    if (this.isProcessing) return;
    if (!this.rabbitmq.isConnected()) {
      this.logger.warn('RabbitMQ not connected. Skipping outbox poll.');
      return;
    }

    this.isProcessing = true;

    try {
      // ── Phase 1: Claim events (DB transaction) ──────────────────────
      // Lock rows with SKIP LOCKED, mark as PROCESSING, and commit immediately.
      // This ensures no other worker picks up the same events.
      let claimedEvents: OutboxEvent[] = [];

      await this.outboxRepo.manager.transaction(async (manager) => {
        const pendingEvents = await manager.createQueryBuilder(OutboxEvent, 'outbox')
          .where('outbox.status = :status', { status: OutboxStatus.PENDING })
          .andWhere('outbox.attempts < 5')
          .orderBy('outbox.createdAt', 'ASC')
          .limit(50)
          .setLock('pessimistic_write')
          .setOnLocked('skip_locked')
          .getMany();

        if (pendingEvents.length === 0) return;

        // Mark all as PROCESSING so they won't be picked up again
        const ids = pendingEvents.map(e => e.id);
        await manager.update(OutboxEvent, { id: In(ids) }, { status: OutboxStatus.PROCESSING });

        claimedEvents = pendingEvents;
      });

      if (claimedEvents.length === 0) return;
      this.logger.log(`Processing ${claimedEvents.length} outbox events...`);

      // ── Phase 2: Publish to RabbitMQ (NO DB transaction) ────────────
      // Each event is published independently. If one fails, others still succeed.
      for (const event of claimedEvents) {
        try {
          const published = await this.rabbitmq.publish(
            event.topic,
            event.payload,
            event.correlationId || String(event.id),
          );

          // ── Phase 3: Update status ────────────────────────────────
          if (published) {
            await this.outboxRepo.update(event.id, {
              status: OutboxStatus.PROCESSED,
              processedAt: new Date(),
              error: null,
            });
            this.logger.debug(`Event ${event.id} published to RabbitMQ (topic: ${event.topic})`);
          } else {
            // RabbitMQ NACK'd — increment attempts, reset to PENDING for retry
            const newAttempts = event.attempts + 1;
            await this.outboxRepo.update(event.id, {
              status: newAttempts >= 5 ? OutboxStatus.FAILED : OutboxStatus.PENDING,
              attempts: newAttempts,
              error: 'RabbitMQ publish NACK',
            });
            this.logger.warn(`Event ${event.id} NACK'd by RabbitMQ. Attempt ${newAttempts}/5`);
          }
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Event ${event.id} processing error: ${errorMsg}`);
          const newAttempts = event.attempts + 1;
          await this.outboxRepo.update(event.id, {
            status: newAttempts >= 5 ? OutboxStatus.FAILED : OutboxStatus.PENDING,
            attempts: newAttempts,
            error: errorMsg,
          });
        }
      }
    } catch (error: unknown) {
      const stack = error instanceof Error ? error.stack : String(error);
      this.logger.error('Unhandled error in OutboxWorker', stack);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Stale event recovery: If a worker crashes mid-processing,
   * events stuck in PROCESSING for > 5 minutes are reset to PENDING.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async recoverStaleEvents() {
    const staleThreshold = new Date(Date.now() - OutboxWorker.STALE_TIMEOUT_MS);
    const result = await this.outboxRepo
      .createQueryBuilder()
      .update(OutboxEvent)
      .set({ status: OutboxStatus.PENDING })
      .where('status = :status', { status: OutboxStatus.PROCESSING })
      .andWhere('updatedAt < :threshold', { threshold: staleThreshold })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.warn(`Recovered ${result.affected} stale PROCESSING events back to PENDING.`);
    }
  }

  /**
   * Cleanup: Delete processed outbox events older than 7 days.
   * Prevents the outbox table from bloating.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOutbox() {
    this.logger.log('Starting Outbox cleanup task...');
    const sevenDaysAgo = dayjs().subtract(7, 'days').toDate();

    const result = await this.outboxRepo.delete({
      status: OutboxStatus.PROCESSED,
      processedAt: LessThan(sevenDaysAgo)
    });

    this.logger.log(`Cleanup complete. Deleted ${result.affected} processed events.`);
  }
}
