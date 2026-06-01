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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const rabbitmq_service_1 = require("../../common/services/rabbitmq.service");
let RabbitMQHealthIndicator = class RabbitMQHealthIndicator extends terminus_1.HealthIndicator {
    constructor(rabbitmq) {
        super();
        this.rabbitmq = rabbitmq;
    }
    async isHealthy(key) {
        const isConnected = this.rabbitmq.isConnected();
        const result = {
            [key]: {
                status: isConnected ? 'up' : 'down',
            },
        };
        if (isConnected) {
            return result;
        }
        throw new terminus_1.HealthCheckError('RabbitMQ health check failed', result);
    }
};
exports.RabbitMQHealthIndicator = RabbitMQHealthIndicator;
exports.RabbitMQHealthIndicator = RabbitMQHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rabbitmq_service_1.RabbitMQService])
], RabbitMQHealthIndicator);
//# sourceMappingURL=rabbitmq.health.js.map