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
exports.Item = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const decimal_js_1 = require("decimal.js");
const base_entity_1 = require("../../../../common/entities/base.entity");
const item_type_entity_1 = require("./item-type.entity");
const item_code_group_entity_1 = require("./item-code-group.entity");
const party_entity_1 = require("../../../parties/entities/party.entity");
const currency_entity_1 = require("../../../finance/currencies/entities/currency.entity");
const quantity_type_entity_1 = require("./quantity-type.entity");
const decimal_transformer_1 = require("../../../../common/transformers/decimal.transformer");
let Item = class Item extends base_entity_1.BaseEntity {
};
exports.Item = Item;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Item.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_type_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Item.prototype, "itemTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_code_group_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Item.prototype, "itemCodeGroupId", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ name: 'code', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Item.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'code1', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Item.prototype, "code1", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'code2', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Item.prototype, "code2", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'critical_limit', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Item.prototype, "criticalLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Item.prototype, "image", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'purchase_price', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", Object)
], Item.prototype, "purchasePrice", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'moving_average_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Item.prototype, "movingAverageCost", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'sale_price', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", Object)
], Item.prototype, "salePrice", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'net_price', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", Object)
], Item.prototype, "netPrice", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'currency_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Item.prototype, "currencyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_type_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Item.prototype, "quantityTypeId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 20, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Item.prototype, "kdv", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'total_stock', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Item.prototype, "totalStock", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Item.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Item.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_type_entity_1.ItemType),
    (0, typeorm_1.JoinColumn)({ name: 'item_type_id' }),
    __metadata("design:type", item_type_entity_1.ItemType)
], Item.prototype, "itemType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_code_group_entity_1.ItemCodeGroup, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'item_code_group_id' }),
    __metadata("design:type", item_code_group_entity_1.ItemCodeGroup)
], Item.prototype, "itemCodeGroup", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'provider_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Item.prototype, "providerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => party_entity_1.Party, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'provider_id' }),
    __metadata("design:type", party_entity_1.Party)
], Item.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => currency_entity_1.Currency, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'currency_id' }),
    __metadata("design:type", currency_entity_1.Currency)
], Item.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quantity_type_entity_1.QuantityType),
    (0, typeorm_1.JoinColumn)({ name: 'quantity_type_id' }),
    __metadata("design:type", quantity_type_entity_1.QuantityType)
], Item.prototype, "quantityType", void 0);
exports.Item = Item = __decorate([
    (0, typeorm_1.Entity)('items'),
    (0, typeorm_1.Index)('IDX_ITEM_FULLTEXT', ['name', 'code', 'code1', 'code2', 'description', 'notes'], { fulltext: true })
], Item);
//# sourceMappingURL=item.entity.js.map