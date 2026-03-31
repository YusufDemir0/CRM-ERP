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
let SequenceGeneratorService = SequenceGeneratorService_1 = class SequenceGeneratorService {
    constructor() {
        this.logger = new common_1.Logger(SequenceGeneratorService_1.name);
    }
    async generateItemCode(queryRunner, itemTypeId) {
        const itemType = await queryRunner.query(`SELECT abbreviation FROM item_types WHERE id = ? AND deleted_at IS NULL`, [itemTypeId]);
        if (!itemType || itemType.length === 0) {
            throw new Error(`Item type bulunamadı: ${itemTypeId}`);
        }
        const prefix = itemType[0].abbreviation;
        const sequences = await queryRunner.query(`SELECT id, current_number FROM item_sequences WHERE item_type_id = ? FOR UPDATE`, [itemTypeId]);
        let currentNumber;
        if (sequences.length === 0) {
            await queryRunner.query(`INSERT INTO item_sequences (item_type_id, current_number) VALUES (?, 1)`, [itemTypeId]);
            currentNumber = 1;
        }
        else {
            currentNumber = sequences[0].current_number;
        }
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        await queryRunner.query(`UPDATE item_sequences SET current_number = current_number + 1 WHERE item_type_id = ?`, [itemTypeId]);
        this.logger.debug(`Generated item code: ${code}`);
        return code;
    }
    async generateSaleCode(queryRunner, saleTypeId) {
        const saleType = await queryRunner.query(`SELECT abbreviation FROM sale_types WHERE id = ? AND deleted_at IS NULL`, [saleTypeId]);
        if (!saleType || saleType.length === 0) {
            throw new Error(`Sale type bulunamadı: ${saleTypeId}`);
        }
        const prefix = saleType[0].abbreviation;
        const sequences = await queryRunner.query(`SELECT id, current_number FROM sale_sequences WHERE sale_type_id = ? FOR UPDATE`, [saleTypeId]);
        let currentNumber;
        if (sequences.length === 0) {
            await queryRunner.query(`INSERT INTO sale_sequences (sale_type_id, current_number) VALUES (?, 1)`, [saleTypeId]);
            currentNumber = 1;
        }
        else {
            currentNumber = sequences[0].current_number;
        }
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        await queryRunner.query(`UPDATE sale_sequences SET current_number = current_number + 1 WHERE sale_type_id = ?`, [saleTypeId]);
        this.logger.debug(`Generated sale code: ${code}`);
        return code;
    }
    async generateProductionCode(queryRunner, prefix = 'URT') {
        const sequences = await queryRunner.query(`SELECT id, current_number FROM production_sequences WHERE prefix = ? FOR UPDATE`, [prefix]);
        let currentNumber;
        if (sequences.length === 0) {
            await queryRunner.query(`INSERT INTO production_sequences (prefix, current_number) VALUES (?, 1)`, [prefix]);
            currentNumber = 1;
        }
        else {
            currentNumber = sequences[0].current_number;
        }
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        await queryRunner.query(`UPDATE production_sequences SET current_number = current_number + 1 WHERE prefix = ?`, [prefix]);
        this.logger.debug(`Generated production code: ${code}`);
        return code;
    }
    async generateTransactionCode(queryRunner, prefix) {
        const sequences = await queryRunner.query(`SELECT id, current_number FROM transaction_sequences WHERE prefix = ? FOR UPDATE`, [prefix]);
        let currentNumber;
        if (sequences.length === 0) {
            await queryRunner.query(`INSERT INTO transaction_sequences (prefix, current_number) VALUES (?, 1)`, [prefix]);
            currentNumber = 1;
        }
        else {
            currentNumber = sequences[0].current_number;
        }
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        await queryRunner.query(`UPDATE transaction_sequences SET current_number = current_number + 1 WHERE prefix = ?`, [prefix]);
        this.logger.debug(`Generated transaction code: ${code}`);
        return code;
    }
};
exports.SequenceGeneratorService = SequenceGeneratorService;
exports.SequenceGeneratorService = SequenceGeneratorService = SequenceGeneratorService_1 = __decorate([
    (0, common_1.Injectable)()
], SequenceGeneratorService);
//# sourceMappingURL=sequence-generator.service.js.map