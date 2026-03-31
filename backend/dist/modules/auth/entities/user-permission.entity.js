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
exports.UserPermission = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const permission_entity_1 = require("./permission.entity");
let UserPermission = class UserPermission {
};
exports.UserPermission = UserPermission;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], UserPermission.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'permission_id', type: 'bigint' }),
    __metadata("design:type", Number)
], UserPermission.prototype, "permissionId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'scope_type', type: 'enum', enum: ['global', 'department', 'own'], default: 'global' }),
    __metadata("design:type", String)
], UserPermission.prototype, "scopeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['allow', 'deny'] }),
    __metadata("design:type", String)
], UserPermission.prototype, "effect", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scope_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], UserPermission.prototype, "scopeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], UserPermission.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UserPermission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], UserPermission.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UserPermission.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], UserPermission.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserPermission.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => permission_entity_1.Permission),
    (0, typeorm_1.JoinColumn)({ name: 'permission_id' }),
    __metadata("design:type", permission_entity_1.Permission)
], UserPermission.prototype, "permission", void 0);
exports.UserPermission = UserPermission = __decorate([
    (0, typeorm_1.Entity)('user_permissions')
], UserPermission);
//# sourceMappingURL=user-permission.entity.js.map