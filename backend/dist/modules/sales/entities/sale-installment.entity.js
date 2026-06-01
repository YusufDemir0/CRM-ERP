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
exports.SaleInstallment = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const decimal_js_1 = require("decimal.js");
const base_entity_1 = require("../../../common/entities/base.entity");
const sale_entity_1 = require("./sale.entity");
const decimal_transformer_1 = require("../../../common/transformers/decimal.transformer");
let SaleInstallment = class SaleInstallment extends base_entity_1.BaseEntity {
    constructor() {
        super(...arguments);
        this.amount = new decimal_js_1.Decimal(0);
    }
};
exports.SaleInstallment = SaleInstallment;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sale_id', type: 'bigint' }),
    __metadata("design:type", String)
], SaleInstallment.prototype, "saleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'installment_no', type: 'int' }),
    __metadata("design:type", Number)
], SaleInstallment.prototype, "installmentNo", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'due_date', type: 'date' }),
    __metadata("design:type", String)
], SaleInstallment.prototype, "dueDate", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], SaleInstallment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_status', type: 'varchar', length: 20, default: 'pasif' }),
    __metadata("design:type", String)
], SaleInstallment.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sale_entity_1.Sale, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sale_id' }),
    __metadata("design:type", sale_entity_1.Sale)
], SaleInstallment.prototype, "sale", void 0);
exports.SaleInstallment = SaleInstallment = __decorate([
    (0, typeorm_1.Entity)('sales_installments')
], SaleInstallment);
//# sourceMappingURL=sale-installment.entity.js.map