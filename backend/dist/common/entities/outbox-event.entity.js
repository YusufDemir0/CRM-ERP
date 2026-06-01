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
exports.OutboxEvent = exports.OutboxStatus = void 0;
const typeorm_1 = require("typeorm");
var OutboxStatus;
(function (OutboxStatus) {
    OutboxStatus["PENDING"] = "pending";
    OutboxStatus["PROCESSING"] = "processing";
    OutboxStatus["PROCESSED"] = "processed";
    OutboxStatus["FAILED"] = "failed";
})(OutboxStatus || (exports.OutboxStatus = OutboxStatus = {}));
let OutboxEvent = class OutboxEvent {
};
exports.OutboxEvent = OutboxEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", String)
], OutboxEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], OutboxEvent.prototype, "topic", void 0);
__decorate([
    (0, typeorm_1.Column)('json'),
    __metadata("design:type", Object)
], OutboxEvent.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: OutboxStatus,
        default: OutboxStatus.PENDING,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], OutboxEvent.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], OutboxEvent.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], OutboxEvent.prototype, "correlationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], OutboxEvent.prototype, "error", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], OutboxEvent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Object)
], OutboxEvent.prototype, "processedAt", void 0);
exports.OutboxEvent = OutboxEvent = __decorate([
    (0, typeorm_1.Entity)('outbox_events')
], OutboxEvent);
//# sourceMappingURL=outbox-event.entity.js.map