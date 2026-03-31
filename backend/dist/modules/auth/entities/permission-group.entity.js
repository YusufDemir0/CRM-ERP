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
exports.PermissionGroup = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const permission_entity_1 = require("./permission.entity");
let PermissionGroup = class PermissionGroup extends base_entity_1.BaseEntity {
};
exports.PermissionGroup = PermissionGroup;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PermissionGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => permission_entity_1.Permission),
    (0, typeorm_1.JoinTable)({
        name: 'permission_group_items',
        joinColumn: { name: 'group_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], PermissionGroup.prototype, "permissions", void 0);
exports.PermissionGroup = PermissionGroup = __decorate([
    (0, typeorm_1.Entity)('permission_groups')
], PermissionGroup);
//# sourceMappingURL=permission-group.entity.js.map