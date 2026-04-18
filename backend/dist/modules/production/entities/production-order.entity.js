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
exports.ProductionOrder = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const decimal_js_1 = require("decimal.js");
const base_entity_1 = require("../../../common/entities/base.entity");
const bom_entity_1 = require("./bom.entity");
const department_entity_1 = require("../../departments/entities/department.entity");
const decimal_transformer_1 = require("../../../common/transformers/decimal.transformer");
let ProductionOrder = class ProductionOrder extends base_entity_1.BaseEntity {
};
exports.ProductionOrder = ProductionOrder;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ProductionOrder.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bom_id', type: 'bigint' }),
    __metadata("design:type", Number)
], ProductionOrder.prototype, "bomId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_department_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], ProductionOrder.prototype, "sourceDepartmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_department_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], ProductionOrder.prototype, "targetDepartmentId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'planned_quantity', type: 'decimal', precision: 15, scale: 4, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], ProductionOrder.prototype, "plannedQuantity", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'produced_quantity', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], ProductionOrder.prototype, "producedQuantity", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'wastage_quantity', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], ProductionOrder.prototype, "wastageQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['draft', 'planned', 'in_progress', 'completed', 'cancelled'], default: 'draft' }),
    __metadata("design:type", String)
], ProductionOrder.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], ProductionOrder.prototype, "unitCost", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'total_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], ProductionOrder.prototype, "totalCost", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'labor_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], ProductionOrder.prototype, "laborCost", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value ? String(value) : value),
    (0, typeorm_1.Column)({ name: 'overhead_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new decimal_transformer_1.DecimalTransformer() }),
    __metadata("design:type", decimal_js_1.Decimal)
], ProductionOrder.prototype, "overheadCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], ProductionOrder.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], ProductionOrder.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ProductionOrder.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bom_entity_1.Bom),
    (0, typeorm_1.JoinColumn)({ name: 'bom_id' }),
    __metadata("design:type", bom_entity_1.Bom)
], ProductionOrder.prototype, "bom", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department),
    (0, typeorm_1.JoinColumn)({ name: 'source_department_id' }),
    __metadata("design:type", department_entity_1.Department)
], ProductionOrder.prototype, "sourceDepartment", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department),
    (0, typeorm_1.JoinColumn)({ name: 'target_department_id' }),
    __metadata("design:type", department_entity_1.Department)
], ProductionOrder.prototype, "targetDepartment", void 0);
exports.ProductionOrder = ProductionOrder = __decorate([
    (0, typeorm_1.Entity)('production_orders'),
    (0, typeorm_1.Unique)(['code'])
], ProductionOrder);
//# sourceMappingURL=production-order.entity.js.map