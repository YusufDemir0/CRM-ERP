"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SequenceGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const item_code_group_entity_1 = require("../../modules/inventory/items/entities/item-code-group.entity");
const item_code_sequence_entity_1 = require("../../modules/inventory/items/entities/item-code-sequence.entity");
const sale_type_entity_1 = require("../../modules/sales/entities/sale-type.entity");
const sale_sequence_entity_1 = require("../../modules/sales/entities/sale-sequence.entity");
const production_sequence_entity_1 = require("../../modules/production/entities/production-sequence.entity");
const transaction_sequence_entity_1 = require("../../modules/finance/transactions/entities/transaction-sequence.entity");
let SequenceGeneratorService = SequenceGeneratorService_1 = class SequenceGeneratorService {
    constructor() {
        this.logger = new common_1.Logger(SequenceGeneratorService_1.name);
    }
    async generateItemCode(queryRunner, itemCodeGroupId) {
        const codeGroup = await queryRunner.manager.findOne(item_code_group_entity_1.ItemCodeGroup, {
            where: { id: itemCodeGroupId },
        });
        if (!codeGroup) {
            throw new common_1.NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);
        }
        const prefix = codeGroup.prefix;
        let sequence = await queryRunner.manager.findOne(item_code_sequence_entity_1.ItemCodeSequence, {
            where: { itemCodeGroupId },
            lock: { mode: 'pessimistic_write' },
        });
        let currentNumber;
        if (!sequence) {
            sequence = queryRunner.manager.create(item_code_sequence_entity_1.ItemCodeSequence, {
                itemCodeGroupId,
                currentNumber: 1,
            });
            await queryRunner.manager.save(sequence);
            currentNumber = 1;
        }
        else {
            currentNumber = sequence.currentNumber;
        }
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        await queryRunner.manager.update(item_code_sequence_entity_1.ItemCodeSequence, sequence.id, {
            currentNumber: currentNumber + 1,
        });
        this.logger.debug(`Generated item code: ${code}`);
        return code;
    }
    async generateSaleCode(queryRunner, saleTypeId) {
        const saleType = await queryRunner.manager.findOne(sale_type_entity_1.SaleType, {
            where: { id: saleTypeId },
        });
        if (!saleType) {
            throw new common_1.NotFoundException(`Sale type bulunamadı: ${saleTypeId}`);
        }
        const prefix = saleType.abbreviation;
        let sequence = await queryRunner.manager.findOne(sale_sequence_entity_1.SaleSequence, {
            where: { saleTypeId },
            lock: { mode: 'pessimistic_write' },
        });
        let currentNumber;
        if (!sequence) {
            sequence = queryRunner.manager.create(sale_sequence_entity_1.SaleSequence, {
                saleTypeId,
                currentNumber: 1,
            });
            await queryRunner.manager.save(sequence);
            currentNumber = 1;
        }
        else {
            currentNumber = sequence.currentNumber;
        }
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        await queryRunner.manager.update(sale_sequence_entity_1.SaleSequence, sequence.id, {
            currentNumber: currentNumber + 1,
        });
        this.logger.debug(`Generated sale code: ${code}`);
        return code;
    }
    async generateProductionCode(queryRunner, prefix = 'URT') {
        let sequence = await queryRunner.manager.findOne(production_sequence_entity_1.ProductionSequence, {
            where: { prefix },
            lock: { mode: 'pessimistic_write' },
        });
        let currentNumber;
        if (!sequence) {
            sequence = queryRunner.manager.create(production_sequence_entity_1.ProductionSequence, {
                prefix,
                currentNumber: 1,
            });
            await queryRunner.manager.save(sequence);
            currentNumber = 1;
        }
        else {
            currentNumber = sequence.currentNumber;
        }
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        await queryRunner.manager.update(production_sequence_entity_1.ProductionSequence, sequence.id, {
            currentNumber: currentNumber + 1,
        });
        this.logger.debug(`Generated production code: ${code}`);
        return code;
    }
    async generateTransactionCode(queryRunner, prefix) {
        let sequence = await queryRunner.manager.findOne(transaction_sequence_entity_1.TransactionSequence, {
            where: { prefix },
            lock: { mode: 'pessimistic_write' },
        });
        let currentNumber;
        if (!sequence) {
            sequence = queryRunner.manager.create(transaction_sequence_entity_1.TransactionSequence, {
                prefix,
                currentNumber: 1,
            });
            await queryRunner.manager.save(sequence);
            currentNumber = 1;
        }
        else {
            currentNumber = sequence.currentNumber;
        }
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        await queryRunner.manager.update(transaction_sequence_entity_1.TransactionSequence, sequence.id, {
            currentNumber: currentNumber + 1,
        });
        this.logger.debug(`Generated transaction code: ${code}`);
        return code;
    }
};
exports.SequenceGeneratorService = SequenceGeneratorService;
exports.SequenceGeneratorService = SequenceGeneratorService = SequenceGeneratorService_1 = __decorate([
    (0, common_1.Injectable)()
], SequenceGeneratorService);
//# sourceMappingURL=sequence-generator.service.js.map