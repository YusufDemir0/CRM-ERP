"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RabbitMQService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib_1 = require("amqplib");
let RabbitMQService = RabbitMQService_1 = class RabbitMQService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(RabbitMQService_1.name);
        this.connection = null;
        this.publishChannel = null;
        this.consumeChannel = null;
        this.reconnecting = false;
        this.url = this.config.get('rabbitmq.url') || 'amqp://erp_user:changeme@localhost:5672/ermay';
        this.exchangeName = this.config.get('rabbitmq.exchange.name') || 'ermay.events';
        this.dlqName = this.config.get('rabbitmq.queues.deadLetter.name') || 'ermay.outbox.dlq';
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        try {
            this.connection = await (0, amqplib_1.connect)(this.url);
            this.logger.log('✅ RabbitMQ connected');
            this.connection.on('error', (err) => {
                this.logger.error(`RabbitMQ connection error: ${err.message}`);
            });
            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed. Reconnecting...');
                this.publishChannel = null;
                this.consumeChannel = null;
                this.scheduleReconnect();
            });
            await this.setupInfrastructure();
        }
        catch (error) {
            this.logger.error(`RabbitMQ connection failed: ${error.message}`);
            this.scheduleReconnect();
        }
    }
    scheduleReconnect() {
        if (this.reconnecting)
            return;
        this.reconnecting = true;
        setTimeout(async () => {
            this.reconnecting = false;
            this.logger.log('Attempting RabbitMQ reconnection...');
            await this.connect();
        }, 5000);
    }
    async disconnect() {
        try {
            if (this.publishChannel)
                await this.publishChannel.close();
            if (this.consumeChannel)
                await this.consumeChannel.close();
            if (this.connection)
                await this.connection.close();
            this.logger.log('RabbitMQ disconnected gracefully');
        }
        catch (error) {
            this.logger.error(`RabbitMQ disconnect error: ${error.message}`);
        }
    }
    async setupInfrastructure() {
        if (!this.connection)
            return;
        this.publishChannel = await this.connection.createConfirmChannel();
        this.logger.log('✅ RabbitMQ publish channel (confirms) created');
        this.consumeChannel = await this.connection.createChannel();
        const prefetch = this.config.get('rabbitmq.prefetchCount') || 10;
        await this.consumeChannel.prefetch(prefetch);
        this.logger.log('✅ RabbitMQ consume channel created');
        await this.publishChannel.assertExchange(this.exchangeName, 'topic', { durable: true });
        await this.publishChannel.assertExchange(`${this.exchangeName}.dlx`, 'fanout', { durable: true });
        await this.publishChannel.assertQueue(this.dlqName, { durable: true });
        await this.publishChannel.bindQueue(this.dlqName, `${this.exchangeName}.dlx`, '');
        this.logger.log(`✅ Exchange "${this.exchangeName}" + DLQ "${this.dlqName}" ready`);
    }
    async publish(routingKey, payload, correlationId) {
        if (!this.publishChannel) {
            this.logger.error('Cannot publish: no channel available');
            return false;
        }
        const message = Buffer.from(JSON.stringify(payload));
        const options = {
            persistent: true,
            contentType: 'application/json',
            timestamp: Date.now(),
            messageId: correlationId || undefined,
            headers: {
                'x-correlation-id': correlationId || '',
                'x-published-at': new Date().toISOString(),
            },
        };
        return new Promise((resolve) => {
            this.publishChannel.publish(this.exchangeName, routingKey, message, options, (err) => {
                if (err) {
                    this.logger.error(`Publish NACK for "${routingKey}": ${err.message}`);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    async subscribe(queueName, routingPattern, handler) {
        if (!this.consumeChannel) {
            this.logger.error('Cannot subscribe: no channel available');
            return;
        }
        await this.consumeChannel.assertQueue(queueName, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': `${this.exchangeName}.dlx`,
            },
        });
        await this.consumeChannel.bindQueue(queueName, this.exchangeName, routingPattern);
        await this.consumeChannel.consume(queueName, async (msg) => {
            if (!msg)
                return;
            try {
                await handler(msg);
                this.consumeChannel.ack(msg);
            }
            catch (error) {
                this.logger.error(`Consumer error on "${queueName}": ${error.message}`);
                this.consumeChannel.nack(msg, false, false);
            }
        });
        this.logger.log(`✅ Subscribed to queue "${queueName}" (pattern: ${routingPattern})`);
    }
    isConnected() {
        return this.connection !== null && this.publishChannel !== null;
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = RabbitMQService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMQService);
//# sourceMappingURL=rabbitmq.service.js.map