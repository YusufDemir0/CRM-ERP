"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('rabbitmq', () => ({
    url: process.env.RABBITMQ_URL || 'amqp://erp_user:changeme@localhost:5672/ermay',
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
    exchange: {
        name: 'ermay.events',
        type: 'topic',
        durable: true,
    },
    prefetchCount: 10,
}));
//# sourceMappingURL=rabbitmq.config.js.map