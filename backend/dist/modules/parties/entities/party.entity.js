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
exports.Party = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const currency_entity_1 = require("../../finance/currencies/entities/currency.entity");
let Party = class Party extends base_entity_1.BaseEntity {
};
exports.Party = Party;
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['customer', 'provider', 'both'], default: 'customer' }),
    __metadata("design:type", String)
], Party.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Party.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Party.prototype, "phone1", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Party.prototype, "phone2", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_number', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Party.prototype, "taxNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Party.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Party.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Party.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_limit', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Party.prototype, "creditLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_terms', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Party.prototype, "paymentTerms", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Party.prototype, "currencyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Party.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => currency_entity_1.Currency, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'currency_id' }),
    __metadata("design:type", currency_entity_1.Currency)
], Party.prototype, "currency", void 0);
exports.Party = Party = __decorate([
    (0, typeorm_1.Entity)('parties')
], Party);
//# sourceMappingURL=party.entity.js.map