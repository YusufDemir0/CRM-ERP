import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { ClsService } from 'nestjs-cls';
import { Injectable } from '@nestjs/common';

/**
 * AuditSubscriber — Veritabanı işlemlerinde createdBy ve updatedBy alanlarını otomatik doldurur.
 * AsyncLocalStorage (ClsService) kullanarak aktif kullanıcıyı her yerden güvenli bir şekilde okur.
 */
@EventSubscriber()
@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  /**
   * Kayıt eklenmeden önce çalışır.
   */
  beforeInsert(event: InsertEvent<unknown>) {
    const userId = this.cls.get('userId');
    if (userId && event.entity && typeof event.entity === 'object' && ('createdBy' in event.entity)) {
      event.entity.createdBy = userId;
    }
    if (userId && event.entity && typeof event.entity === 'object' && ('updatedBy' in event.entity)) {
      event.entity.updatedBy = userId;
    }
  }

  /**
   * Kayıt güncellenmeden önce çalışır.
   */
  beforeUpdate(event: UpdateEvent<unknown>) {
    const userId = this.cls.get('userId');
    if (userId && event.entity && ('updatedBy' in event.entity)) {
      event.entity.updatedBy = userId;
    }
  }

  /**
   * Kayıt eklendikten sonra çalışır.
   */
  async afterInsert(event: InsertEvent<unknown>) {
    await this.logAction(event, 'insert');
  }

  /**
   * Kayıt güncellendikten sonra çalışır.
   */
  async afterUpdate(event: UpdateEvent<unknown>) {
    await this.logAction(event, 'update');
  }

  /**
   * Kayıt silindikten sonra çalışır.
   */
  async afterRemove(event: RemoveEvent<unknown>) {
    // Note: Remove events are tricky depending on how they are called.
    // BaseEntity uses soft-delete usually, which is an Update.
  }

  private async logAction(event: InsertEvent<unknown> | UpdateEvent<unknown> | RemoveEvent<unknown>, action: 'insert' | 'update' | 'delete') {
    const userId = this.cls.get('userId');
    const entity = event.entity;
    const entityName = event.metadata.name;
    
    // AuditLog kendisini loglamasın (infinite loop önleme)
    if (entityName === 'AuditLog' || !entity) return;

    const audit = new AuditLog();
    audit.entityName = entityName;
    
    // Get ID reliably. In updates, entity might not have ID, but databaseEntity does.
    const entityId = (entity as { id?: number })?.id || (event as { databaseEntity?: { id?: number } }).databaseEntity?.id || null;
    audit.entityId = entityId;
    
    audit.action = action;
    audit.userId = userId || null;
    
    if (action === 'update' && (event as { databaseEntity?: object }).databaseEntity) {
      audit.oldValues = JSON.stringify((event as { databaseEntity?: object }).databaseEntity);
      audit.newValues = JSON.stringify(event.entity);
    } else {
      audit.newValues = JSON.stringify(event.entity);
    }

    // Final check: don't save if there's no useful data
    if (!audit.newValues && !audit.oldValues) return;

    const manager = event.manager;
    try {
      await manager.save(AuditLog, audit);
    } catch (err) {
      // 🔴 SECURITY: In an ERP, if we can't audit, we CANNOT proceed with the transaction.
      // Throwing here will trigger a rollback of the parent transaction (Sales, Production, etc.)
      throw new Error(`Critical Audit Failure: ${err.message}. Transaction aborted for safety.`);
    }
  }
}
