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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("./entities/transaction.entity");
const party_entity_1 = require("../../parties/entities/party.entity");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
let TransactionsService = class TransactionsService {
    constructor(txRepo, partyRepo, dataSource, sequenceGenerator) {
        this.txRepo = txRepo;
        this.partyRepo = partyRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
    }
    async findAll(query) {
        const qb = this.txRepo.createQueryBuilder('tx')
            .leftJoinAndSelect('tx.party', 'party')
            .leftJoinAndSelect('tx.commercialAccount', 'account')
            .leftJoinAndSelect('tx.currency', 'currency');
        if (query.search)
            qb.where('(tx.code LIKE :s OR party.name LIKE :s)', { s: `%${query.search}%` });
        if (query.partyId)
            qb.andWhere('tx.partyId = :partyId', { partyId: query.partyId });
        if (query.type)
            qb.andWhere('tx.type = :type', { type: query.type });
        if (query.status)
            qb.andWhere('tx.status = :status', { status: query.status });
        qb.orderBy('tx.date', 'DESC').addOrderBy('tx.createdAt', 'DESC');
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const tx = await this.txRepo.findOne({
            where: { id },
            relations: ['party', 'commercialAccount', 'currency'],
        });
        if (!tx)
            throw new common_1.NotFoundException('İşlem bulunamadı');
        return tx;
    }
    async create(dto, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const prefix = dto.type === 'in' ? 'MKB' : 'TDY';
            const code = await this.sequenceGenerator.generateTransactionCode(queryRunner, prefix);
            const tx = queryRunner.manager.create(transaction_entity_1.Transaction, {
                code,
                partyId: dto.partyId,
                commercialAccountId: dto.commercialAccountId,
                amount: dto.amount,
                currencyId: dto.currencyId || null,
                type: dto.type,
                referenceType: dto.referenceType || null,
                referenceId: dto.referenceId || null,
                date: dto.date,
                description: dto.description || null,
                status: 'completed',
                createdBy: userId,
            });
            const savedTx = await queryRunner.manager.save(tx);
            const party = await queryRunner.manager.findOne(party_entity_1.Party, { where: { id: dto.partyId } });
            if (!party)
                throw new common_1.NotFoundException('Cari hesap bulunamadı');
            const currentBalance = Number(party.balance);
            const newBalance = dto.type === 'in'
                ? currentBalance - dto.amount
                : currentBalance + dto.amount;
            await queryRunner.manager.update(party_entity_1.Party, party.id, {
                balance: newBalance,
                updatedBy: userId,
            });
            await queryRunner.commitTransaction();
            return this.findOne(savedTx.id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(party_entity_1.Party)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map