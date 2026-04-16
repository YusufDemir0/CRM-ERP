import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
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
  beforeInsert(event: InsertEvent<any>) {
    const userId = this.cls.get('userId');
    if (userId && event.entity && ('createdBy' in event.entity)) {
      event.entity.createdBy = userId;
    }
    if (userId && event.entity && ('updatedBy' in event.entity)) {
      event.entity.updatedBy = userId;
    }
  }

  /**
   * Kayıt güncellenmeden önce çalışır.
   */
  beforeUpdate(event: UpdateEvent<any>) {
    const userId = this.cls.get('userId');
    if (userId && event.entity && ('updatedBy' in event.entity)) {
      event.entity.updatedBy = userId;
    }
  }
}
