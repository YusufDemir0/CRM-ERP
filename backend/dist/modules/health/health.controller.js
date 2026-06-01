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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const rabbitmq_health_1 = require("./rabbitmq.health");
const typeorm_1 = require("typeorm");
let HealthController = class HealthController {
    constructor(health, db, rmqIndicator, dataSource) {
        this.health = health;
        this.db = db;
        this.rmqIndicator = rmqIndicator;
        this.dataSource = dataSource;
    }
    check() {
        return this.health.check([
            () => this.db.pingCheck('database', { timeout: 3000 }),
            () => this.rmqIndicator.isHealthy('rabbitmq'),
        ]);
    }
    async getDiagnostics() {
        const results = {};
        try {
            const tables = await this.dataSource.query('SHOW TABLES');
            results.tables = tables;
            const outboxExists = tables.some((t) => Object.values(t).includes('outbox_events'));
            if (outboxExists) {
                results.outbox_events_schema = await this.dataSource.query('DESCRIBE outbox_events');
            }
            else {
                results.outbox_events_schema = 'NOT FOUND';
            }
            const installmentsExists = tables.some((t) => Object.values(t).includes('sales_installments'));
            if (installmentsExists) {
                results.sales_installments_schema = await this.dataSource.query('DESCRIBE sales_installments');
            }
            else {
                results.sales_installments_schema = 'NOT FOUND';
            }
            results.sales_schema = await this.dataSource.query('DESCRIBE sales');
            results.parties_schema = await this.dataSource.query('DESCRIBE parties');
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                const sale = await queryRunner.manager.query('SELECT * FROM sales LIMIT 1');
                results.test_sale_fetch = sale;
                if (sale && sale.length > 0) {
                    const s = sale[0];
                    await queryRunner.manager.query('SELECT * FROM sales WHERE id = ? FOR UPDATE', [s.id]);
                    results.test_sale_lock = 'SUCCESS';
                }
                await queryRunner.commitTransaction();
            }
            catch (txErr) {
                results.test_tx_error = txErr.message || txErr;
                await queryRunner.rollbackTransaction();
            }
            finally {
                await queryRunner.release();
            }
        }
        catch (err) {
            results.error = err.message || err;
            if (err.stack) {
                results.stack = err.stack;
            }
        }
        return results;
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('diag'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getDiagnostics", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.TypeOrmHealthIndicator,
        rabbitmq_health_1.RabbitMQHealthIndicator,
        typeorm_1.DataSource])
], HealthController);
//# sourceMappingURL=health.controller.js.map