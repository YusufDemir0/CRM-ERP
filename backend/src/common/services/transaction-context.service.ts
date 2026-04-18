import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { EntityManager, DataSource } from 'typeorm';

@Injectable()
export class TransactionContextService {
  constructor(
    private readonly cls: ClsService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Returns the current transactional manager or the default one if no transaction is active.
   */
  get manager(): EntityManager {
    return this.cls.get<EntityManager>('TRANSACTION_MANAGER') || this.dataSource.manager;
  }

  /**
   * Returns the current EntityManager if in a transaction, or null otherwise.
   */
  getAvailableManager(): EntityManager | null {
    return this.cls.get<EntityManager>('TRANSACTION_MANAGER') || null;
  }

  /**
   * Sets the current EntityManager for the transaction context.
   */
  setManager(manager: EntityManager): void {
    this.cls.set('TRANSACTION_MANAGER', manager);
  }

  /**
   * Clears the transaction context.
   */
  clear(): void {
    this.cls.set('TRANSACTION_MANAGER', null);
  }
}
