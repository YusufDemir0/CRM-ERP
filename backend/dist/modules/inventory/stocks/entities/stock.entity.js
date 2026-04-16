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
exports.Stock = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const decimal_js_1 = require("decimal.js");
const base_entity_1 = require("../../../../common/entities/base.entity");
const item_entity_1 = require("../../items/entities/item.entity");
const department_entity_1 = require("../../../departments/entities/department.entity");
const decimal_transformer_1 = require("../../../../common/transformers/decimal.transformer");
let Stock = class Stock extends base_entity_1.BaseEntity {
};
exports.Stock = Stock;
__decorate([
    (0, typeorm_1.Column)({ name: 'item_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Stock.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'department_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Stock.prototype, "departmentId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Stock.prototype, "quantity", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'reserved_quantity', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], Stock.prototype, "reservedQuantity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], Stock.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", department_entity_1.Department)
], Stock.prototype, "department", void 0);
exports.Stock = Stock = __decorate([
    (0, typeorm_1.Entity)('stocks'),
    (0, typeorm_1.Unique)(['itemId', 'departmentId']),
    (0, typeorm_1.Check)(`"quantity" >= 0`)
], Stock);
//# sourceMappingURL=stock.entity.js.map