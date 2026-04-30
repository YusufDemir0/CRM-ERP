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
    async getNextNumber(table, idField, idValue) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            let [row] = await queryRunner.query(`SELECT current_number as id FROM ${table} WHERE ${idField} = ? FOR UPDATE`, [idValue]);
            let current = 1;
            if (!row) {
                try {
                    await queryRunner.query(`INSERT INTO ${table} (${idField}, current_number) VALUES (?, ?)`, [idValue, 1]);
                }
                catch (insertErr) {
                    [row] = await queryRunner.query(`SELECT current_number as id FROM ${table} WHERE ${idField} = ? FOR UPDATE`, [idValue]);
                    current = Number(row.id) + 1;
                    await queryRunner.query(`UPDATE ${table} SET current_number = ? WHERE ${idField} = ?`, [current, idValue]);
                }
            }
            else {
                current = Number(row.id) + 1;
                await queryRunner.query(`UPDATE ${table} SET current_number = ? WHERE ${idField} = ?`, [current, idValue]);
            }
            await queryRunner.commitTransaction();
            return current;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error generating sequence for ${table} (${idField}=${idValue}): ${err.message}`);
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async generateItemCode(manager = this.transactionContext.manager, itemCodeGroupId) {
        const codeGroup = await manager.findOne(item_code_group_entity_1.ItemCodeGroup, { where: { id: itemCodeGroupId } });
        if (!codeGroup)
            throw new common_1.NotFoundException(`Item code group bulunamadı: ${itemCodeGroupId}`);
        const currentNumber = await this.getNextNumber('item_code_sequences', 'item_code_group_id', itemCodeGroupId);
        const code = `${codeGroup.prefix}-${String(currentNumber).padStart(3, '0')}`;
        return code;
    }
    async generateSaleCode(manager = this.transactionContext.manager, departmentId) {
        const department = await manager.findOne(department_entity_1.Department, { where: { id: departmentId } });
        if (!department)
            throw new common_1.NotFoundException(`Departman bulunamadı: ${departmentId}`);
        const deptPrefix = (department.abbreviation || 'GEN').toUpperCase();
        const finalPrefix = `M${deptPrefix}`;
        const currentNumber = await this.getNextNumber('sale_sequences', 'department_id', departmentId);
        const code = `${finalPrefix}${String(currentNumber).padStart(5, '0')}`;
        return code;
    }
    async generateProductionCode(manager = this.transactionContext.manager, prefix = 'URT') {
        const currentNumber = await this.getNextNumber('production_sequences', 'prefix', prefix);
        const code = `${prefix}-${String(currentNumber).padStart(3, '0')}`;
        return code;
    }
    async generateTransactionCode(manager = this.transactionContext.manager, prefix) {
        const currentNumber = await this.getNextNumber('transaction_sequences', 'prefix', prefix);
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