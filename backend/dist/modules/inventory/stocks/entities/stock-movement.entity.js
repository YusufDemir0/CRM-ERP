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
exports.StockMovement = void 0;
const typeorm_1 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const base_entity_1 = require("../../../../common/entities/base.entity");
const stock_entity_1 = require("./stock.entity");
const decimal_transformer_1 = require("../../../../common/transformers/decimal.transformer");
let StockMovement = class StockMovement extends base_entity_1.BaseEntity {
};
exports.StockMovement = StockMovement;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'stock_id', type: 'bigint' }),
    __metadata("design:type", Number)
], StockMovement.prototype, "stockId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], StockMovement.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_before', type: 'decimal', precision: 15, scale: 4, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], StockMovement.prototype, "quantityBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_after', type: 'decimal', precision: 15, scale: 4, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], StockMovement.prototype, "quantityAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['in', 'out'] }),
    __metadata("design:type", String)
], StockMovement.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], StockMovement.prototype, "unitCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], StockMovement.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'reference_type', type: 'enum', enum: ['sale', 'purchase', 'production', 'adjustment', 'return', 'manual', 'revert', 'shipment', 'transfer'] }),
    __metadata("design:type", String)
], StockMovement.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'reference_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], StockMovement.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], StockMovement.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], StockMovement.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => stock_entity_1.Stock),
    (0, typeorm_1.JoinColumn)({ name: 'stock_id' }),
    __metadata("design:type", stock_entity_1.Stock)
], StockMovement.prototype, "stock", void 0);
exports.StockMovement = StockMovement = __decorate([
    (0, typeorm_1.Entity)('stock_movements')
], StockMovement);
//# sourceMappingURL=stock-movement.entity.js.map