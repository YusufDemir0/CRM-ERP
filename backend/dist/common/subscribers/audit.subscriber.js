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
exports.AuditSubscriber = void 0;
const typeorm_1 = require("typeorm");
const nestjs_cls_1 = require("nestjs-cls");
const common_1 = require("@nestjs/common");
let AuditSubscriber = class AuditSubscriber {
    constructor(dataSource, cls) {
        this.dataSource = dataSource;
        this.cls = cls;
        this.dataSource.subscribers.push(this);
    }
    beforeInsert(event) {
        const userId = this.cls.get('userId');
        if (userId && event.entity && ('createdBy' in event.entity)) {
            event.entity.createdBy = userId;
        }
        if (userId && event.entity && ('updatedBy' in event.entity)) {
            event.entity.updatedBy = userId;
        }
    }
    beforeUpdate(event) {
        const userId = this.cls.get('userId');
        if (userId && event.entity && ('updatedBy' in event.entity)) {
            event.entity.updatedBy = userId;
        }
    }
};
exports.AuditSubscriber = AuditSubscriber;
exports.AuditSubscriber = AuditSubscriber = __decorate([
    (0, typeorm_1.EventSubscriber)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        nestjs_cls_1.ClsService])
], AuditSubscriber);
//# sourceMappingURL=audit.subscriber.js.map