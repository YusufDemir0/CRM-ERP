import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { EntityManager, DataSource } from 'typeorm';

@Injectable()
export class TransactionContextService {
  constructor(
    private readonly txHost: TransactionHost<any>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Returns the current transactional manager or the default one if no transaction is active.
   */
  get manager(): EntityManager {
    try {
      // In @nestjs-cls/transactional, txHost.tx returns the transactional instance (EntityManager)
      return (this.txHost.tx as EntityManager) || this.dataSource.manager;
    } catch {
      return this.dataSource.manager;
    }
  }

  /**
   * Returns the current EntityManager if in a transaction, or null otherwise.
   */
  getAvailableManager(): EntityManager | null {
    try {
      return (this.txHost.tx as EntityManager) || null;
    } catch {
      return null;
    }
  }
}
