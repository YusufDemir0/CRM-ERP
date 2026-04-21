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
exports.SaleSequence = void 0;
const typeorm_1 = require("typeorm");
let SaleSequence = class SaleSequence {
};
exports.SaleSequence = SaleSequence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], SaleSequence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'department_id', type: 'bigint' }),
    __metadata("design:type", Number)
], SaleSequence.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_number', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], SaleSequence.prototype, "currentNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], SaleSequence.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], SaleSequence.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], SaleSequence.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], SaleSequence.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], SaleSequence.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], SaleSequence.prototype, "state", void 0);
exports.SaleSequence = SaleSequence = __decorate([
    (0, typeorm_1.Entity)('sale_sequences'),
    (0, typeorm_1.Unique)(['departmentId'])
], SaleSequence);
//# sourceMappingURL=sale-sequence.entity.js.map