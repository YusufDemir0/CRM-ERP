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
exports.Sale = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const decimal_js_1 = require("decimal.js");
const base_entity_1 = require("../../../common/entities/base.entity");
const party_entity_1 = require("../../parties/entities/party.entity");
const sale_type_entity_1 = require("./sale-type.entity");
const currency_entity_1 = require("../../finance/currencies/entities/currency.entity");
const sale_item_entity_1 = require("./sale-item.entity");
const decimal_transformer_1 = require("../../../common/transformers/decimal.transformer");
const staff_entity_1 = require("../../staff/entities/staff.entity");
const commercial_account_entity_1 = require("../../finance/accounts/entities/commercial-account.entity");
const department_entity_1 = require("../../departments/entities/department.entity");
let Sale = class Sale extends base_entity_1.BaseEntity {
    constructor() {
        super(...arguments);
        this.exchangeRate = new decimal_js_1.Decimal(1);
        this.deposit = new decimal_js_1.Decimal(0);
        this.totalAmount = new decimal_js_1.Decimal(0);
        this.discountAmount = new decimal_js_1.Decimal(0);
        this.discountPercent = new decimal_js_1.Decimal(0);
        this.kdv = new decimal_js_1.Decimal(0);
        this.grandTotal = new decimal_js_1.Decimal(0);
        this.totalCost = new decimal_js_1.Decimal(0);
        this.profit = new decimal_js_1.Decimal(0);
    }
};
exports.Sale = Sale;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Sale.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'party_id', type: 'bigint' }),
    __metadata("design:type", String)
], Sale.prototype, "partyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sale_type_id', type: 'bigint' }),
    __metadata("design:type", String)
], Sale.prototype, "saleTypeId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'department_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'staff_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "staffId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'currency_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "currencyId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: 1, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Sale.prototype, "exchangeRate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'delivery_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "deliveryDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'enum', enum: ['draft', 'approved', 'shipped', 'invoiced', 'cancelled'], default: 'draft' }),
    __metadata("design:type", String)
], Sale.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'deposit', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Sale.prototype, "deposit", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Sale.prototype, "totalAmount", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Sale.prototype, "discountAmount", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Sale.prototype, "discountPercent", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'kdv', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Sale.prototype, "kdv", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Sale.prototype, "grandTotal", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Sale.prototype, "totalCost", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'profit', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Sale.prototype, "profit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_detail', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_city', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_district', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_tax_id', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "taxNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_email', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lead_source', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'commercial_account_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "commercialAccountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => party_entity_1.Party),
    (0, typeorm_1.JoinColumn)({ name: 'party_id' }),
    __metadata("design:type", party_entity_1.Party)
], Sale.prototype, "party", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sale_type_entity_1.SaleType),
    (0, typeorm_1.JoinColumn)({ name: 'sale_type_id' }),
    __metadata("design:type", sale_type_entity_1.SaleType)
], Sale.prototype, "saleType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => currency_entity_1.Currency, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'currency_id' }),
    __metadata("design:type", currency_entity_1.Currency)
], Sale.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => staff_entity_1.Staff, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'staff_id' }),
    __metadata("design:type", Object)
], Sale.prototype, "staff", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => commercial_account_entity_1.CommercialAccount, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'commercial_account_id' }),
    __metadata("design:type", Object)
], Sale.prototype, "commercialAccount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", Object)
], Sale.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sale_item_entity_1.SaleItem, (si) => si.sale),
    __metadata("design:type", Array)
], Sale.prototype, "items", void 0);
exports.Sale = Sale = __decorate([
    (0, typeorm_1.Entity)('sales'),
    (0, typeorm_1.Unique)(['code']),
    (0, typeorm_1.Index)('IDX_SALE_FULLTEXT', ['code', 'notes', 'phone', 'address', 'city', 'district', 'taxNumber', 'email', 'source'], { fulltext: true })
], Sale);
//# sourceMappingURL=sale.entity.js.map