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
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let HealthController = class HealthController {
    constructor(health, db, memory, disk, microservice, configService, dataSource) {
        this.health = health;
        this.db = db;
        this.memory = memory;
        this.disk = disk;
        this.microservice = microservice;
        this.configService = configService;
        this.dataSource = dataSource;
    }
    check() {
        return this.health.check([
            () => this.db.pingCheck('database', { timeout: 3000 }),
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
            () => this.disk.checkStorage('disk_storage', {
                thresholdPercent: parseFloat(this.configService.get('HEALTH_DISK_THRESHOLD') || '0.99'),
                path: '/',
            }),
        ]);
    }
    async getDiagnostics() {
        const results = {};
        try {
            results.stock_movements_schema = await this.dataSource.query('DESCRIBE stock_movements');
            results.stocks_schema = await this.dataSource.query('DESCRIBE stocks');
            results.shipments_schema = await this.dataSource.query('DESCRIBE shipments');
            results.sales_schema = await this.dataSource.query('DESCRIBE sales');
            results.recent_movements = await this.dataSource.query('SELECT * FROM stock_movements ORDER BY id DESC LIMIT 5');
            results.recent_shipments = await this.dataSource.query('SELECT * FROM shipments ORDER BY id DESC LIMIT 5');
            results.recent_sales = await this.dataSource.query('SELECT * FROM sales ORDER BY id DESC LIMIT 5');
        }
        catch (err) {
            results.error = err instanceof Error ? err.message : String(err);
            if (err instanceof Error) {
                results.stack = err.stack;
            }
        }
        return results;
    }
    async debugDispatch() {
        const results = {};
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const [shipment] = await queryRunner.query('SELECT * FROM shipments WHERE id = 1');
            results.shipment = shipment;
            if (!shipment) {
                results.error = 'Shipment 1 not found';
                return results;
            }
            const saleItems = await queryRunner.query('SELECT * FROM sale_items WHERE sale_id = ?', [shipment.sale_id]);
            results.saleItems = saleItems;
            for (const si of saleItems) {
                const stocks = await queryRunner.query('SELECT * FROM stocks WHERE item_id = ? AND department_id = ?', [si.item_id, shipment.outgoing_department_id]);
                results[`stock_item_${si.item_id}`] = stocks;
                try {
                    const stockId = stocks.length > 0 ? stocks[0].id : null;
                    if (stockId) {
                        await queryRunner.query(`INSERT INTO stock_movements (stock_id, quantity, quantity_before, quantity_after, type, reference_type, reference_id, description, created_by)
               VALUES (?, ?, ?, ?, 'out', 'reserve', ?, 'TEST - will rollback', '1')`, [stockId, si.quantity, stocks[0].quantity, stocks[0].quantity, shipment.id]);
                        results[`movement_insert_item_${si.item_id}`] = 'SUCCESS';
                    }
                    else {
                        results[`movement_insert_item_${si.item_id}`] = 'NO_STOCK_ROW';
                    }
                }
                catch (insertErr) {
                    const errObj = insertErr;
                    results[`movement_insert_item_${si.item_id}_ERROR`] = {
                        message: errObj?.message || String(insertErr),
                        code: errObj?.code || errObj?.errno,
                        sqlMessage: errObj?.sqlMessage,
                    };
                }
            }
        }
        catch (err) {
            const errObj = err;
            results.error = errObj?.message || String(err);
            results.code = errObj?.code || errObj?.errno;
            results.sqlMessage = errObj?.sqlMessage;
            if (err instanceof Error) {
                results.stack = err.stack;
            }
        }
        finally {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
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
__decorate([
    (0, common_1.Get)('debug-dispatch'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "debugDispatch", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.TypeOrmHealthIndicator,
        terminus_1.MemoryHealthIndicator,
        terminus_1.DiskHealthIndicator,
        terminus_1.MicroserviceHealthIndicator,
        config_1.ConfigService,
        typeorm_1.DataSource])
], HealthController);
//# sourceMappingURL=health.controller.js.map