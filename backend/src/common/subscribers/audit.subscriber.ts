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

/**
 * AuditSubscriber — Veritabanı işlemlerini izler ve loglar.
 * ROAST COMPLIANCE: Artik AuditLog tablosuna yazmak yerine JSON formatında stdout'a basar.
 * Bu, RDBMS üzerindeki yükü azaltır ve log yönetimini ELK/Loki gibi dış sistemlere devreder.
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
    this.logAction(event, 'INSERT');
  }

  async afterUpdate(event: UpdateEvent<unknown>) {
    this.logAction(event, 'UPDATE');
  }

  async afterRemove(event: RemoveEvent<unknown>) {
    this.logAction(event, 'DELETE');
  }

  private logAction(event: InsertEvent<unknown> | UpdateEvent<unknown> | RemoveEvent<unknown>, action: string) {
    const userId = this.cls.get('userId');
    const entityName = event.metadata.name;
    
    // Infinite loop ve gereksiz log önleme
    if (entityName === 'AuditLog' || entityName === 'OutboxEvent') return;

    const entity = event.entity;
    const entityId = (entity as { id?: string | number })?.id || (event as { databaseEntity?: { id?: string | number } }).databaseEntity?.id || 'unknown';

    const logPayload = {
      reqId: this.cls.get('reqId'),
      timestamp: new Date().toISOString(),
      action,
      entity: entityName,
      entityId,
      userId: userId || null,
      changes: action === 'UPDATE' ? {
        updatedFields: (event as UpdateEvent<unknown>).updatedColumns.map(c => c.propertyName)
      } : { id: entityId }
    };

    // 🔥 RDBMS'den Çıkarıldı: Sadece Stdout/JSON
    this.logger.log(JSON.stringify(logPayload));
  }
}
