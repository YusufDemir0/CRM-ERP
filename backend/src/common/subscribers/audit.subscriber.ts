import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { Injectable, Logger } from '@nestjs/common';
import { SystemLog } from '../../modules/logs/entities/log.entity';

/**
 * AuditSubscriber — Veritabanı işlemlerini izler ve loglar.
 * Hibrit Sistem: Düşük seviyeli teknik loglar sadece stdout/Loki'de kalırken,
 * yüksek değerli iş/audit logları (Cari, Satış, Üretim vb.) doğrudan system_logs veritabanı tablosuna da yazılır.
 */
@EventSubscriber()
@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger('AUDIT');

  constructor(
    private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  beforeInsert(event: InsertEvent<unknown>) {
    const userId = this.cls.get('userId');
    if (userId && event.entity && typeof event.entity === 'object' && ('createdBy' in event.entity)) {
      (event.entity as { createdBy?: number }).createdBy = userId;
    }
    if (userId && event.entity && typeof event.entity === 'object' && ('updatedBy' in event.entity)) {
      (event.entity as { updatedBy?: number }).updatedBy = userId;
    }
  }

  beforeUpdate(event: UpdateEvent<unknown>) {
    const userId = this.cls.get('userId');
    if (userId && event.entity && ('updatedBy' in event.entity)) {
      (event.entity as { updatedBy?: number }).updatedBy = userId;
    }
  }

  async afterInsert(event: InsertEvent<unknown>) {
    await this.logAction(event, 'INSERT');
  }

  async afterUpdate(event: UpdateEvent<unknown>) {
    await this.logAction(event, 'UPDATE');
  }

  async afterRemove(event: RemoveEvent<unknown>) {
    await this.logAction(event, 'DELETE');
  }

  private async logAction(
    event: InsertEvent<unknown> | UpdateEvent<unknown> | RemoveEvent<unknown>,
    action: string,
  ) {
    const entityName = event.metadata.name;

    // Sonsuz döngüyü ve gereksiz logları önleme
    if (
      entityName === 'SystemLog' ||
      entityName === 'AuditLog' ||
      entityName === 'OutboxEvent' ||
      entityName === 'SystemLogEntity'
    ) {
      return;
    }

    const userId = this.cls.get('userId');
    const username = this.cls.get('username') || null;
    const fullName = this.cls.get('fullName') || null;
    const ipAddress = this.cls.get('ipAddress') || null;

    const dbEntity = (event as { databaseEntity?: Record<string, unknown> }).databaseEntity;
    const rawEntity = (event.entity || dbEntity || {}) as Record<string, unknown>;
    const entityId = (rawEntity as { id?: string | number })?.id || dbEntity?.id || 'unknown';

    let changes: Record<string, unknown> = { id: entityId };
    if (action === 'UPDATE') {
      const updateEvt = event as UpdateEvent<Record<string, unknown>>;
      const updatedColumns = updateEvt.updatedColumns?.slice(0, 20).map((c) => c.propertyName) || [];
      const diff: Record<string, { from?: unknown; to?: unknown }> = {};

      for (const col of updatedColumns) {
        const fromVal = updateEvt.databaseEntity ? updateEvt.databaseEntity[col] : undefined;
        const toVal = updateEvt.entity ? updateEvt.entity[col] : undefined;
        diff[col] = { from: fromVal, to: toVal };
      }

      changes = {
        updatedFields: updatedColumns,
        diff,
      };
    }

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
      changes,
    };

    // 1. Stdout (Enterprise Standard)
    try {
      this.logger.log(JSON.stringify(logPayload));
    } catch {
      this.logger.warn(`Audit log stdout serialization failed for ${entityName}:${entityId}`);
    }

    // 2. Hibrit DB Logging: Yüksek değerli iş mantığı tabloları veritabanındaki system_logs tablosuna yazılır.
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
        const detailsText = this.getEntityFriendlyDescription(entityName, rawEntity, action);

        await event.manager.insert(SystemLog, {
          userId: userId ? String(userId) : undefined,
          username: username || undefined,
          fullName: fullName || undefined,
          action,
          module: moduleName || undefined,
          tag: 'INFO',
          details: detailsText || undefined,
          ipAddress: ipAddress || undefined,
        });
      } catch (err) {
        this.logger.error(`Failed to save DB audit log for ${entityName}: ${err.message}`);
      }
    }
  }

  private getFriendlyEntityName(entityName: string): string {
    const map: Record<string, string> = {
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

  private getEntityModule(entityName: string): string {
    const map: Record<string, string> = {
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

  private getEntityFriendlyDescription(entityName: string, entity: Record<string, unknown> | null | undefined, action: string): string {
    const name = (entity?.name || entity?.fullName || entity?.username || entity?.code || entity?.title || '') as string;
    const label = name ? `"${name}"` : '';
    const friendlyEntity = this.getFriendlyEntityName(entityName);

    if (action === 'INSERT') {
      return `Yeni ${friendlyEntity} sisteme eklendi: ${label}`.trim();
    } else if (action === 'UPDATE') {
      return `${friendlyEntity} bilgileri güncellendi: ${label}`.trim();
    } else if (action === 'DELETE') {
      return `${friendlyEntity} sistemden silindi: ${label}`.trim();
    }
    return `${friendlyEntity} üzerinde işlem yapıldı: ${label}`.trim();
  }
}
