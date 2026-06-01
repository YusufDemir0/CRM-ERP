import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsumeMessage } from 'amqplib';
export declare class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private connection;
    private publishChannel;
    private consumeChannel;
    private reconnecting;
    private readonly url;
    private readonly exchangeName;
    private readonly dlqName;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private scheduleReconnect;
    private disconnect;
    private setupInfrastructure;
    publish(routingKey: string, payload: unknown, correlationId?: string): Promise<boolean>;
    subscribe(queueName: string, routingPattern: string, handler: (msg: ConsumeMessage) => Promise<void>): Promise<void>;
    isConnected(): boolean;
}
