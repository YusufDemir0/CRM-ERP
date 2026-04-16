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
exports.Transaction = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const decimal_js_1 = require("decimal.js");
const base_entity_1 = require("../../../../common/entities/base.entity");
const party_entity_1 = require("../../../parties/entities/party.entity");
const commercial_account_entity_1 = require("../../accounts/entities/commercial-account.entity");
const currency_entity_1 = require("../../currencies/entities/currency.entity");
const decimal_transformer_1 = require("../../../../common/transformers/decimal.transformer");
let Transaction = class Transaction extends base_entity_1.BaseEntity {
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Transaction.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'party_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], Transaction.prototype, "partyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'commercial_account_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], Transaction.prototype, "commercialAccountId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "currencyId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: 1, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Transaction.prototype, "exchangeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['in', 'out'] }),
    __metadata("design:type", String)
], Transaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_type', type: 'enum', enum: ['sale', 'purchase', 'manual_adjustment', 'manual'], nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Transaction.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['pending', 'completed', 'bounced_check', 'cancelled'], default: 'pending' }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => party_entity_1.Party),
    (0, typeorm_1.JoinColumn)({ name: 'party_id' }),
    __metadata("design:type", party_entity_1.Party)
], Transaction.prototype, "party", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => commercial_account_entity_1.CommercialAccount),
    (0, typeorm_1.JoinColumn)({ name: 'commercial_account_id' }),
    __metadata("design:type", commercial_account_entity_1.CommercialAccount)
], Transaction.prototype, "commercialAccount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => currency_entity_1.Currency, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'currency_id' }),
    __metadata("design:type", currency_entity_1.Currency)
], Transaction.prototype, "currency", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)('transactions'),
    (0, typeorm_1.Unique)(['code'])
], Transaction);
//# sourceMappingURL=transaction.entity.js.map