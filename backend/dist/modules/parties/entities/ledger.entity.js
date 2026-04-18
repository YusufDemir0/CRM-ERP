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
exports.AccountingLedger = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const party_entity_1 = require("./party.entity");
const commercial_account_entity_1 = require("../../finance/accounts/entities/commercial-account.entity");
const decimal_transformer_1 = require("../../../common/transformers/decimal.transformer");
const decimal_js_1 = require("decimal.js");
let AccountingLedger = class AccountingLedger extends base_entity_1.BaseEntity {
};
exports.AccountingLedger = AccountingLedger;
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], AccountingLedger.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'party_id' }),
    __metadata("design:type", Number)
], AccountingLedger.prototype, "partyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], AccountingLedger.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => commercial_account_entity_1.CommercialAccount),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", commercial_account_entity_1.CommercialAccount)
], AccountingLedger.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], AccountingLedger.prototype, "debit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], AccountingLedger.prototype, "credit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_id', nullable: true }),
    __metadata("design:type", Number)
], AccountingLedger.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], AccountingLedger.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AccountingLedger.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => party_entity_1.Party),
    (0, typeorm_1.JoinColumn)({ name: 'party_id' }),
    __metadata("design:type", party_entity_1.Party)
], AccountingLedger.prototype, "party", void 0);
exports.AccountingLedger = AccountingLedger = __decorate([
    (0, typeorm_1.Entity)('accounting_ledger'),
    (0, typeorm_1.Index)(['partyId', 'date'])
], AccountingLedger);
//# sourceMappingURL=ledger.entity.js.map