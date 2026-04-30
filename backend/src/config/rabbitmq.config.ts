import { registerAs } from '@nestjs/config';

/**
 * RabbitMQ Configuration — Enterprise Ready
 * 
 * Currently used for: Outbox event publishing (FAZ 2+)
 * Future: Cross-service communication, dead-letter queues
 */
export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://erp_user:changeme@localhost:5672/ermay',
  
  // Queue configuration
  queues: {
    outbox: {
      name: 'ermay.outbox.events',
      durable: true,
    },
    deadLetter: {
      name: 'ermay.outbox.dlq',
      durable: true,
    },
  },

  // Exchange configuration
  exchange: {
    name: 'ermay.events',
    type: 'topic' as const,
    durable: true,
  },

  // Prefetch count for consumer (prevents overloading worker)
  prefetchCount: 10,
}));
