"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionInternal = void 0;
exports.Transactional = Transactional;
class TransactionInternal {
}
exports.TransactionInternal = TransactionInternal;
function Transactional() {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            if (!TransactionInternal.dataSource || !TransactionInternal.cls) {
                return originalMethod.apply(this, args);
            }
            const existingManager = TransactionInternal.cls.get('TRANSACTION_MANAGER');
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
            }
            catch (err) {
                await queryRunner.rollbackTransaction();
                throw err;
            }
            finally {
                await queryRunner.release();
                TransactionInternal.cls.set('TRANSACTION_MANAGER', null);
            }
        };
        return descriptor;
    };
}
//# sourceMappingURL=transactional.decorator.js.map