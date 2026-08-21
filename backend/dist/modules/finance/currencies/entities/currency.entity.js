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
exports.Currency = void 0;
const typeorm_1 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const base_entity_1 = require("../../../../common/entities/base.entity");
const decimal_transformer_1 = require("../../../../common/transformers/decimal.transformer");
let Currency = class Currency extends base_entity_1.BaseEntity {
};
exports.Currency = Currency;
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 3 }),
    __metadata("design:type", String)
], Currency.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Currency.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], Currency.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: 1, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Currency.prototype, "exchangeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_default', type: 'tinyint', default: 0 }),
    __metadata("design:type", Number)
], Currency.prototype, "isDefault", void 0);
exports.Currency = Currency = __decorate([
    (0, typeorm_1.Entity)('currencies'),
    (0, typeorm_1.Unique)(['code'])
], Currency);
//# sourceMappingURL=currency.entity.js.map