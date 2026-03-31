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
exports.Department = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const commercial_account_entity_1 = require("../../finance/accounts/entities/commercial-account.entity");
let Department = class Department extends base_entity_1.BaseEntity {
};
exports.Department = Department;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Department.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Department.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Department.prototype, "abbreviation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'commercial_account_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Department.prototype, "commercialAccountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => commercial_account_entity_1.CommercialAccount, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'commercial_account_id' }),
    __metadata("design:type", commercial_account_entity_1.CommercialAccount)
], Department.prototype, "commercialAccount", void 0);
exports.Department = Department = __decorate([
    (0, typeorm_1.Entity)('departments')
], Department);
//# sourceMappingURL=department.entity.js.map