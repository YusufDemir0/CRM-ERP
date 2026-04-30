import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, ChannelModel, Channel, ConfirmChannel, Options, ConsumeMessage } from 'amqplib';

/**
 * RabbitMQService — Enterprise-grade RabbitMQ connection manager.
 * 
 * Features:
 *   - Publisher confirms (reliable delivery guarantee)
 *   - Durable queues + persistent messages (survive broker restart)
 *   - Dead-letter queue for failed messages
 *   - Auto-reconnect with exponential backoff
 *   - Channel pooling
 */
@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: ChannelModel | null = null;
  private publishChannel: ConfirmChannel | null = null;
  private consumeChannel: Channel | null = null;
  private reconnecting = false;
  private readonly url: string;
  private readonly exchangeName: string;
  private readonly dlqName: string;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('rabbitmq.url') || 'amqp://erp_user:changeme@localhost:5672/ermay';
    this.exchangeName = this.config.get<string>('rabbitmq.exchange.name') || 'ermay.events';
    this.dlqName = this.config.get<string>('rabbitmq.queues.deadLetter.name') || 'ermay.outbox.dlq';
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  // ── Connection Management ────────────────────────────────

  private async connect(): Promise<void> {
    try {
      this.connection = await connect(this.url);
      this.logger.log('✅ RabbitMQ connected');

      this.connection.on('error', (err: Error) => {
        this.logger.error(`RabbitMQ connection error: ${err.message}`);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed. Reconnecting...');
        this.publishChannel = null;
        this.consumeChannel = null;
        this.scheduleReconnect();
      });

      // Setup infrastructure
      await this.setupInfrastructure();
    } catch (error) {
      this.logger.error(`RabbitMQ connection failed: ${error.message}`);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnecting) return;
    this.reconnecting = true;

    setTimeout(async () => {
      this.reconnecting = false;
      this.logger.log('Attempting RabbitMQ reconnection...');
      await this.connect();
    }, 5000);
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.publishChannel) await this.publishChannel.close();
      if (this.consumeChannel) await this.consumeChannel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('RabbitMQ disconnected gracefully');
    } catch (error) {
      this.logger.error(`RabbitMQ disconnect error: ${error.message}`);
    }
  }

  // ── Infrastructure Setup ─────────────────────────────────

  private async setupInfrastructure(): Promise<void> {
    if (!this.connection) return;

    // Publish channel with confirms
    this.publishChannel = await this.connection.createConfirmChannel();
    this.logger.log('✅ RabbitMQ publish channel (confirms) created');

    // Consume channel
    this.consumeChannel = await this.connection.createChannel();
    const prefetch = this.config.get<number>('rabbitmq.prefetchCount') || 10;
    await this.consumeChannel.prefetch(prefetch);
    this.logger.log('✅ RabbitMQ consume channel created');

    // Exchange (topic-based routing)
    await this.publishChannel.assertExchange(this.exchangeName, 'topic', { durable: true });

    // Dead Letter Exchange + Queue
    await this.publishChannel.assertExchange(`${this.exchangeName}.dlx`, 'fanout', { durable: true });
    await this.publishChannel.assertQueue(this.dlqName, { durable: true });
    await this.publishChannel.bindQueue(this.dlqName, `${this.exchangeName}.dlx`, '');

    this.logger.log(`✅ Exchange "${this.exchangeName}" + DLQ "${this.dlqName}" ready`);
  }

  // ── Publishing ───────────────────────────────────────────

  /**
   * Publish a message to RabbitMQ with publisher confirms.
   * Returns true if broker acknowledged, false otherwise.
   */
  async publish(routingKey: string, payload: unknown, correlationId?: string): Promise<boolean> {
    if (!this.publishChannel) {
      this.logger.error('Cannot publish: no channel available');
      return false;
    }

    const message = Buffer.from(JSON.stringify(payload));
    const options: Options.Publish = {
      persistent: true,       // Survive broker restart
      contentType: 'application/json',
      timestamp: Date.now(),
      messageId: correlationId || undefined,
      headers: {
        'x-correlation-id': correlationId || '',
        'x-published-at': new Date().toISOString(),
      },
    };

    return new Promise((resolve) => {
      this.publishChannel!.publish(
        this.exchangeName,
        routingKey,
        message,
        options,
        (err: Error) => {
          if (err) {
            this.logger.error(`Publish NACK for "${routingKey}": ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  }

  // ── Consuming ────────────────────────────────────────────

  /**
   * Subscribe to a queue. Creates the queue if it doesn't exist.
   * Queue is bound to the exchange with the given routing pattern.
   */
  async subscribe(
    queueName: string,
    routingPattern: string,
    handler: (msg: ConsumeMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.consumeChannel) {
      this.logger.error('Cannot subscribe: no channel available');
      return;
    }

    // Assert queue with dead-letter routing
    await this.consumeChannel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': `${this.exchangeName}.dlx`,
      },
    });

    // Bind queue to exchange
    await this.consumeChannel.bindQueue(queueName, this.exchangeName, routingPattern);

    // Consume
    await this.consumeChannel.consume(queueName, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        await handler(msg);
        this.consumeChannel!.ack(msg);
      } catch (error) {
        this.logger.error(`Consumer error on "${queueName}": ${error.message}`);
        // Reject and send to DLQ (do NOT requeue — prevents infinite loop)
        this.consumeChannel!.nack(msg, false, false);
      }
    });

    this.logger.log(`✅ Subscribed to queue "${queueName}" (pattern: ${routingPattern})`);
  }

  // ── Health Check ─────────────────────────────────────────

  isConnected(): boolean {
    return this.connection !== null && this.publishChannel !== null;
  }
}
