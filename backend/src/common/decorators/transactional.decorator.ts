import { DataSource, EntityManager } from 'typeorm';
import { ClsService } from 'nestjs-cls';

/**
 * 🔴 ARCH-01: Global Transaction Reference (Internal Utility)
 * Used by @Transactional decorator to access DB and CLS context.
 */
export class TransactionInternal {
  static dataSource: DataSource;
  static cls: ClsService;
}

/**
 * @Transactional Decorator
 * Automatically wraps a method in a TypeORM transaction.
 * Stores the EntityManager in ClsService for use by subscribers/other services.
 */
export function Transactional() {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      if (!TransactionInternal.dataSource || !TransactionInternal.cls) {
        return originalMethod.apply(this, args);
      }

      // If already in a transaction, just run the method
      const existingManager = TransactionInternal.cls.get<EntityManager>('TRANSACTION_MANAGER');
      if (existingManager) {
        return originalMethod.apply(this, args);
      }

      const queryRunner = TransactionInternal.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        TransactionInternal.cls.set('TRANSACTION_MANAGER', queryRunner.manager);
        const result = await originalMethod.apply(this, args);
        await queryRunner.commitTransaction();
        return result;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
        TransactionInternal.cls.set('TRANSACTION_MANAGER', null);
      }
    };

    return descriptor;
  };
}
