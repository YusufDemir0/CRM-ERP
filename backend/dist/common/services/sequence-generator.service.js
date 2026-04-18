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
var SequenceGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const item_code_group_entity_1 = require("../../modules/inventory/items/entities/item-code-group.entity");
const item_code_sequence_entity_1 = require("../../modules/inventory/items/entities/item-code-sequence.entity");
const sale_type_entity_1 = require("../../modules/sales/entities/sale-type.entity");
const sale_sequence_entity_1 = require("../../modules/sales/entities/sale-sequence.entity");
const production_sequence_entity_1 = require("../../modules/production/entities/production-sequence.entity");
const transaction_sequence_entity_1 = require("../../modules/finance/transactions/entities/transaction-sequence.entity");
const transaction_context_service_1 = require("./transaction-context.service");
let SequenceGeneratorService = SequenceGeneratorService_1 = class SequenceGeneratorService {
    constructor(transactionContext, dataSource) {
        this.transactionContext = transactionContext;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(SequenceGeneratorService_1.name);
    }
    async generateItemCode(manager = this.transactionContext.manager, itemCodeGroupId) {
        const codeGroup = await manager.findOne(item_code_group_entity_1.ItemCodeGroup, { where: { id: itemCodeGroupId } });
        if (!codeGroup) {
            throw new common_1.NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);
        }
        const prefix = codeGroup.prefix;
        return await this.dataSource.transaction(async (autonomousManager) => {
            let sequence = await autonomousManager.findOne(item_code_sequence_entity_1.ItemCodeSequence, { where: { itemCodeGroupId } });
            if (!sequence) {
                try {
                    const newSeq = autonomousManager.create(item_code_sequence_entity_1.ItemCodeSequence, { itemCodeGroupId, currentNumber: 2 });
                    await autonomousManager.save(newSeq);
                    return `${prefix}-001`;
                }
                catch (e) {
                }
            }
            sequence = await autonomousManager
                .createQueryBuilder(item_code_sequence_entity_1.ItemCodeSequence, 'seq')
                .setLock('pessimistic_write')
                .where('seq.itemCodeGroupId = :id', { id: itemCodeGroupId })
                .getOne();
            const currentNumber = sequence.currentNumber;
            await autonomousManager.update(item_code_sequence_entity_1.ItemCodeSequence, sequence.id, {
                currentNumber: currentNumber + 1
            });
            const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
            this.logger.debug(`Generated item code: ${code}`);
            return code;
        });
    }
    async generateSaleCode(manager = this.transactionContext.manager, saleTypeId) {
        const saleType = await manager.findOne(sale_type_entity_1.SaleType, { where: { id: saleTypeId } });
        if (!saleType) {
            throw new common_1.NotFoundException(`Sale type bulunamadı: ${saleTypeId}`);
        }
        const prefix = saleType.abbreviation;
        return await this.dataSource.transaction(async (autonomousManager) => {
            let sequence = await autonomousManager.findOne(sale_sequence_entity_1.SaleSequence, { where: { saleTypeId } });
            if (!sequence) {
                try {
                    const newSeq = autonomousManager.create(sale_sequence_entity_1.SaleSequence, { saleTypeId, currentNumber: 2 });
                    await autonomousManager.save(newSeq);
                    return `${prefix}-001`;
                }
                catch (e) {
                }
            }
            sequence = await autonomousManager
                .createQueryBuilder(sale_sequence_entity_1.SaleSequence, 'seq')
                .setLock('pessimistic_write')
                .where('seq.saleTypeId = :id', { id: saleTypeId })
                .getOne();
            const currentNumber = sequence.currentNumber;
            await autonomousManager.update(sale_sequence_entity_1.SaleSequence, sequence.id, {
                currentNumber: currentNumber + 1
            });
            const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
            this.logger.debug(`Generated sale code: ${code}`);
            return code;
        });
    }
    async generateProductionCode(manager = this.transactionContext.manager, prefix = 'URT') {
        return await this.dataSource.transaction(async (autonomousManager) => {
            let sequence = await autonomousManager.findOne(production_sequence_entity_1.ProductionSequence, { where: { prefix } });
            if (!sequence) {
                try {
                    const newSeq = autonomousManager.create(production_sequence_entity_1.ProductionSequence, { prefix, currentNumber: 2 });
                    await autonomousManager.save(newSeq);
                    return `${prefix}-001`;
                }
                catch (e) {
                }
            }
            sequence = await autonomousManager
                .createQueryBuilder(production_sequence_entity_1.ProductionSequence, 'seq')
                .setLock('pessimistic_write')
                .where('seq.prefix = :prefix', { prefix })
                .getOne();
            const currentNumber = sequence.currentNumber;
            await autonomousManager.update(production_sequence_entity_1.ProductionSequence, sequence.id, {
                currentNumber: currentNumber + 1
            });
            const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
            this.logger.debug(`Generated production code: ${code}`);
            return code;
        });
    }
    async generateTransactionCode(manager = this.transactionContext.manager, prefix) {
        return await this.dataSource.transaction(async (autonomousManager) => {
            let sequence = await autonomousManager.findOne(transaction_sequence_entity_1.TransactionSequence, { where: { prefix } });
            if (!sequence) {
                try {
                    const newSeq = autonomousManager.create(transaction_sequence_entity_1.TransactionSequence, { prefix, currentNumber: 2 });
                    await autonomousManager.save(newSeq);
                    return `${prefix}-001`;
                }
                catch (e) {
                }
            }
            sequence = await autonomousManager
                .createQueryBuilder(transaction_sequence_entity_1.TransactionSequence, 'seq')
                .setLock('pessimistic_write')
                .where('seq.prefix = :prefix', { prefix })
                .getOne();
            const currentNumber = sequence.currentNumber;
            await autonomousManager.update(transaction_sequence_entity_1.TransactionSequence, sequence.id, {
                currentNumber: currentNumber + 1
            });
            const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
            this.logger.debug(`Generated transaction code: ${code}`);
            return code;
        });
    }
};
exports.SequenceGeneratorService = SequenceGeneratorService;
exports.SequenceGeneratorService = SequenceGeneratorService = SequenceGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transaction_context_service_1.TransactionContextService,
        typeorm_1.DataSource])
], SequenceGeneratorService);
//# sourceMappingURL=sequence-generator.service.js.map