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
exports.Shipment = void 0;
const typeorm_1 = require("typeorm");
const sale_entity_1 = require("../../../sales/entities/sale.entity");
const department_entity_1 = require("../../../departments/entities/department.entity");
const vehicle_entity_1 = require("./vehicle.entity");
const staff_entity_1 = require("../../../staff/entities/staff.entity");
let Shipment = class Shipment {
};
exports.Shipment = Shipment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], Shipment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'sale_id', type: 'bigint' }),
    __metadata("design:type", String)
], Shipment.prototype, "saleId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'outgoing_department_id', type: 'bigint' }),
    __metadata("design:type", String)
], Shipment.prototype, "outgoingDepartmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_city', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Shipment.prototype, "deliveryCity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_district', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Shipment.prototype, "deliveryDistrict", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_address', type: 'text' }),
    __metadata("design:type", String)
], Shipment.prototype, "deliveryAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'carrier_name_or_plate', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Shipment.prototype, "carrierNameOrPlate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pending', 'shipped', 'completed', 'cancelled'],
        default: 'pending'
    }),
    __metadata("design:type", String)
], Shipment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Shipment.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Shipment.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], Shipment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], Shipment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Shipment.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sale_entity_1.Sale, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sale_id' }),
    __metadata("design:type", sale_entity_1.Sale)
], Shipment.prototype, "sale", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department),
    (0, typeorm_1.JoinColumn)({ name: 'outgoing_department_id' }),
    __metadata("design:type", department_entity_1.Department)
], Shipment.prototype, "outgoingDepartment", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => vehicle_entity_1.Vehicle),
    (0, typeorm_1.JoinTable)({
        name: 'shipment_vehicles',
        joinColumn: { name: 'shipment_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'vehicle_id', referencedColumnName: 'id' }
    }),
    __metadata("design:type", Array)
], Shipment.prototype, "vehicles", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => staff_entity_1.Staff),
    (0, typeorm_1.JoinTable)({
        name: 'shipment_staff',
        joinColumn: { name: 'shipment_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'staff_id', referencedColumnName: 'id' }
    }),
    __metadata("design:type", Array)
], Shipment.prototype, "assignedStaff", void 0);
exports.Shipment = Shipment = __decorate([
    (0, typeorm_1.Entity)('shipments')
], Shipment);
//# sourceMappingURL=shipment.entity.js.map