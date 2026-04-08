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
exports.ItemCodeGroup = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
let ItemCodeGroup = class ItemCodeGroup extends base_entity_1.BaseEntity {
};
exports.ItemCodeGroup = ItemCodeGroup;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], ItemCodeGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, unique: true }),
    __metadata("design:type", String)
], ItemCodeGroup.prototype, "prefix", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], ItemCodeGroup.prototype, "state", void 0);
exports.ItemCodeGroup = ItemCodeGroup = __decorate([
    (0, typeorm_1.Entity)('item_code_groups')
], ItemCodeGroup);
//# sourceMappingURL=item-code-group.entity.js.map