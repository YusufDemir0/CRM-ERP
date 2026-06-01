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
const log_entity_1 = require("../../modules/logs/entities/log.entity");
let AuditSubscriber = class AuditSubscriber {
    constructor(dataSource, cls) {
        this.dataSource = dataSource;
        this.cls = cls;
        this.logger = new common_1.Logger('AUDIT');
        this.dataSource.subscribers.push(this);
    }
    beforeInsert(event) {
        const userId = this.cls.get('userId');
        if (userId && event.entity && typeof event.entity === 'object' && ('createdBy' in event.entity)) {
            event.entity.createdBy = userId;
        }
        if (userId && event.entity && typeof event.entity === 'object' && ('updatedBy' in event.entity)) {
            event.entity.updatedBy = userId;
        }
    }
    beforeUpdate(event) {
        const userId = this.cls.get('userId');
        if (userId && event.entity && ('updatedBy' in event.entity)) {
            event.entity.updatedBy = userId;
        }
    }
    async afterInsert(event) {
        await this.logAction(event, 'INSERT');
    }
    async afterUpdate(event) {
        await this.logAction(event, 'UPDATE');
    }
    async afterRemove(event) {
        await this.logAction(event, 'DELETE');
    }
    async logAction(event, action) {
        const entityName = event.metadata.name;
        if (entityName === 'SystemLog' ||
            entityName === 'AuditLog' ||
            entityName === 'OutboxEvent' ||
            entityName === 'SystemLogEntity') {
            return;
        }
        const userId = this.cls.get('userId');
        const username = this.cls.get('username') || null;
        const fullName = this.cls.get('fullName') || null;
        const ipAddress = this.cls.get('ipAddress') || null;
        const entity = event.entity || event.databaseEntity || {};
        const entityId = entity?.id || event.databaseEntity?.id || 'unknown';
        const logPayload = {
            reqId: this.cls.get('reqId'),
            timestamp: new Date().toISOString(),
            action,
            entity: entityName,
            entityId,
            userId: userId || null,
            username,
            fullName,
            ipAddress,
            changes: action === 'UPDATE' ? {
                updatedFields: event.updatedColumns
                    .slice(0, 20)
                    .map(c => c.propertyName)
            } : { id: entityId }
        };
        try {
            this.logger.log(JSON.stringify(logPayload));
        }
        catch {
            this.logger.warn(`Audit log stdout serialization failed for ${entityName}:${entityId}`);
        }
        const trackedEntities = [
            'User',
            'Role',
            'Party',
            'Item',
            'Bom',
            'ProductionOrder',
            'CommercialAccount',
            'Transaction',
            'Sale',
            'Department',
            'Staff',
        ];
        if (trackedEntities.includes(entityName) && process.env.DB_LOGGING_ENABLED !== 'false') {
            try {
                const friendlyName = this.getFriendlyEntityName(entityName);
                const moduleName = this.getEntityModule(entityName);
                const detailsText = this.getEntityFriendlyDescription(entityName, entity, action);
                await event.manager.insert(log_entity_1.SystemLog, {
                    userId: userId ? String(userId) : undefined,
                    username: username || undefined,
                    fullName: fullName || undefined,
                    action,
                    module: moduleName || undefined,
                    tag: 'INFO',
                    details: detailsText || undefined,
                    ipAddress: ipAddress || undefined,
                });
            }
            catch (err) {
                this.logger.error(`Failed to save DB audit log for ${entityName}: ${err.message}`);
            }
        }
    }
    getFriendlyEntityName(entityName) {
        const map = {
            'User': 'Kullanıcı',
            'Role': 'Rol',
            'Party': 'Müşteri/Cari',
            'Item': 'Ürün',
            'Bom': 'Ürün Reçetesi',
            'ProductionOrder': 'Üretim Emri',
            'CommercialAccount': 'Kasa/Banka Hesabı',
            'Transaction': 'Hesap Hareketi',
            'Sale': 'Satış',
            'Department': 'Departman',
            'Staff': 'Personel',
        };
        return map[entityName] || entityName;
    }
    getEntityModule(entityName) {
        const map = {
            'User': 'users',
            'Role': 'roles',
            'Party': 'parties',
            'Item': 'items',
            'Bom': 'production',
            'ProductionOrder': 'production',
            'CommercialAccount': 'finance',
            'Transaction': 'finance',
            'Sale': 'sales',
            'Department': 'departments',
            'Staff': 'staff',
        };
        return map[entityName] || 'system';
    }
    getEntityFriendlyDescription(entityName, entity, action) {
        const name = entity?.name || entity?.fullName || entity?.username || entity?.code || entity?.title || '';
        const label = name ? `"${name}"` : '';
        const friendlyEntity = this.getFriendlyEntityName(entityName);
        if (action === 'INSERT') {
            return `Yeni ${friendlyEntity} sisteme eklendi: ${label}`.trim();
        }
        else if (action === 'UPDATE') {
            return `${friendlyEntity} bilgileri güncellendi: ${label}`.trim();
        }
        else if (action === 'DELETE') {
            return `${friendlyEntity} sistemden silindi: ${label}`.trim();
        }
        return `${friendlyEntity} üzerinde işlem yapıldı: ${label}`.trim();
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