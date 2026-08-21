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
exports.Staff = void 0;
const typeorm_1 = require("typeorm");
const department_entity_1 = require("../../departments/entities/department.entity");
const user_entity_1 = require("../../auth/entities/user.entity");
let Staff = class Staff {
};
exports.Staff = Staff;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], Staff.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Staff.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true, type: 'bigint' }),
    __metadata("design:type", String)
], Staff.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Staff.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', nullable: true, type: 'bigint' }),
    __metadata("design:type", String)
], Staff.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Staff.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Date)
], Staff.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name' }),
    __metadata("design:type", String)
], Staff.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_name' }),
    __metadata("design:type", String)
], Staff.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Staff.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entry_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], Staff.prototype, "entryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_deactivation_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Staff.prototype, "lastDeactivationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 11, nullable: true }),
    __metadata("design:type", Object)
], Staff.prototype, "tckn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'department_id', type: 'bigint' }),
    __metadata("design:type", String)
], Staff.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Staff.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, default: null }),
    __metadata("design:type", Object)
], Staff.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", department_entity_1.Department)
], Staff.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Staff.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by' }),
    __metadata("design:type", user_entity_1.User)
], Staff.prototype, "updator", void 0);
exports.Staff = Staff = __decorate([
    (0, typeorm_1.Entity)('staff')
], Staff);
//# sourceMappingURL=staff.entity.js.map