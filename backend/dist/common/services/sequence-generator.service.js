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
const sale_type_entity_1 = require("../../modules/sales/entities/sale-type.entity");
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
        await manager.query(`INSERT INTO item_code_sequences (item_code_group_id, current_number)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE current_number = current_number + 1`, [itemCodeGroupId]);
        const [row] = await manager.query(`SELECT current_number FROM item_code_sequences WHERE item_code_group_id = ?`, [itemCodeGroupId]);
        const currentNumber = row.current_number;
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        this.logger.debug(`Generated item code: ${code}`);
        return code;
    }
    async generateSaleCode(manager = this.transactionContext.manager, saleTypeId) {
        const saleType = await manager.findOne(sale_type_entity_1.SaleType, { where: { id: saleTypeId } });
        if (!saleType) {
            throw new common_1.NotFoundException(`Sale type bulunamadı: ${saleTypeId}`);
        }
        const prefix = saleType.abbreviation;
        await manager.query(`INSERT INTO sale_sequences (sale_type_id, current_number)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE current_number = current_number + 1`, [saleTypeId]);
        const [row] = await manager.query(`SELECT current_number FROM sale_sequences WHERE sale_type_id = ?`, [saleTypeId]);
        const currentNumber = row.current_number;
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        this.logger.debug(`Generated sale code: ${code}`);
        return code;
    }
    async generateProductionCode(manager = this.transactionContext.manager, prefix = 'URT') {
        await manager.query(`INSERT INTO production_sequences (prefix, current_number)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE current_number = current_number + 1`, [prefix]);
        const [row] = await manager.query(`SELECT current_number FROM production_sequences WHERE prefix = ?`, [prefix]);
        const currentNumber = row.current_number;
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        this.logger.debug(`Generated production code: ${code}`);
        return code;
    }
    async generateTransactionCode(manager = this.transactionContext.manager, prefix) {
        await manager.query(`INSERT INTO transaction_sequences (prefix, current_number)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE current_number = current_number + 1`, [prefix]);
        const [row] = await manager.query(`SELECT current_number FROM transaction_sequences WHERE prefix = ?`, [prefix]);
        const currentNumber = row.current_number;
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        this.logger.debug(`Generated transaction code: ${code}`);
        return code;
    }
};
exports.SequenceGeneratorService = SequenceGeneratorService;
exports.SequenceGeneratorService = SequenceGeneratorService = SequenceGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transaction_context_service_1.TransactionContextService,
        typeorm_1.DataSource])
], SequenceGeneratorService);
//# sourceMappingURL=sequence-generator.service.js.map