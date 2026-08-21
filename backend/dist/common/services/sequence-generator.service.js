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
const department_entity_1 = require("../../modules/departments/entities/department.entity");
const transaction_context_service_1 = require("./transaction-context.service");
let SequenceGeneratorService = SequenceGeneratorService_1 = class SequenceGeneratorService {
    constructor(transactionContext, dataSource) {
        this.transactionContext = transactionContext;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(SequenceGeneratorService_1.name);
    }
    async getNextNumber(manager, table, idField, idValue) {
        try {
            const allowedTables = ['item_code_sequences', 'sale_sequences', 'production_sequences', 'transaction_sequences'];
            const allowedFields = ['item_code_group_id', 'department_id', 'prefix'];
            if (!allowedTables.includes(table) || !allowedFields.includes(idField)) {
                throw new Error(`Güvensiz tablo/alan adı tespit edildi: ${table}.${idField}`);
            }
            await manager.query(`INSERT INTO \`${table}\` (\`${idField}\`, \`current_number\`)
         VALUES (?, 1)
         ON DUPLICATE KEY UPDATE \`current_number\` = LAST_INSERT_ID(\`current_number\` + 1)`, [idValue]);
            const res = await manager.query(`SELECT LAST_INSERT_ID() as nextVal`);
            const nextVal = res && res[0] && res[0].nextVal !== undefined ? Number(res[0].nextVal) : 1;
            return isNaN(nextVal) || nextVal <= 0 ? 1 : nextVal;
        }
        catch (err) {
            const error = err;
            this.logger.error(`Error generating sequence for ${table} (${idField}=${idValue}): ${error.message}`);
            throw err;
        }
    }
    async generateItemCode(manager = this.transactionContext.manager, itemCodeGroupId) {
        const codeGroup = await manager.findOne(item_code_group_entity_1.ItemCodeGroup, { where: { id: itemCodeGroupId } });
        if (!codeGroup)
            throw new common_1.NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);
        const currentNumber = await this.getNextNumber(manager, 'item_code_sequences', 'item_code_group_id', itemCodeGroupId);
        const code = `${codeGroup.prefix}-${String(currentNumber).padStart(3, '0')}`;
        return code;
    }
    async generateSaleCode(manager = this.transactionContext.manager, departmentId) {
        const department = await manager.findOne(department_entity_1.Department, { where: { id: departmentId } });
        if (!department)
            throw new common_1.NotFoundException(`Departman bulunamadı: ${departmentId}`);
        const deptPrefix = (department.abbreviation || 'GEN').toUpperCase();
        const finalPrefix = deptPrefix;
        const currentNumber = await this.getNextNumber(manager, 'sale_sequences', 'department_id', departmentId);
        const code = `${finalPrefix}${String(currentNumber).padStart(5, '0')}`;
        return code;
    }
    async generateProductionCode(manager = this.transactionContext.manager, prefix = 'URT') {
        const currentNumber = await this.getNextNumber(manager, 'production_sequences', 'prefix', prefix);
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        return code;
    }
    async generateTransactionCode(manager = this.transactionContext.manager, prefix) {
        const currentNumber = await this.getNextNumber(manager, 'transaction_sequences', 'prefix', prefix);
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
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