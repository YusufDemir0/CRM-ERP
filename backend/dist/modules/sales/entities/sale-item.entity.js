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
exports.SaleItem = void 0;
const typeorm_1 = require("typeorm");
const sale_entity_1 = require("./sale.entity");
const item_entity_1 = require("../../inventory/items/entities/item.entity");
let SaleItem = class SaleItem {
};
exports.SaleItem = SaleItem;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'sale_id', type: 'bigint' }),
    __metadata("design:type", Number)
], SaleItem.prototype, "saleId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'item_id', type: 'bigint' }),
    __metadata("design:type", Number)
], SaleItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "discountPercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'net_price', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "netPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kdv_rate', type: 'decimal', precision: 5, scale: 2, default: 20 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "kdvRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kdv_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "kdvAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'line_total', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "lineTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SaleItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], SaleItem.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], SaleItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], SaleItem.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], SaleItem.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], SaleItem.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sale_entity_1.Sale, (sale) => sale.items),
    (0, typeorm_1.JoinColumn)({ name: 'sale_id' }),
    __metadata("design:type", sale_entity_1.Sale)
], SaleItem.prototype, "sale", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], SaleItem.prototype, "item", void 0);
exports.SaleItem = SaleItem = __decorate([
    (0, typeorm_1.Entity)('sale_items')
], SaleItem);
//# sourceMappingURL=sale-item.entity.js.map