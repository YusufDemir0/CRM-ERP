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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("./entities/transaction.entity");
const party_entity_1 = require("../../parties/entities/party.entity");
const currency_entity_1 = require("../currencies/entities/currency.entity");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
const date_utils_1 = require("../../../common/utils/date.utils");
const dayjs_1 = __importDefault(require("dayjs"));
let TransactionsService = class TransactionsService {
    constructor(txRepo, dataSource, sequenceGenerator) {
        this.txRepo = txRepo;
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
            const party = await queryRunner.manager.findOne(party_entity_1.Party, { where: { id: dto.partyId } });
            if (!party)
                throw new common_1.NotFoundException('Cari hesap bulunamadı');
            const currency = await queryRunner.manager.findOne(currency_entity_1.Currency, { where: { id: dto.currencyId } });
            const exchangeRate = currency ? Number(currency.exchangeRate) : 1;
            const tlAmount = dto.amount * exchangeRate;
            const currentBalance = Number(party.balance);
            const newBalance = dto.type === 'in' ? currentBalance - tlAmount : currentBalance + tlAmount;
            if (dto.type === 'out' && Number(party.creditLimitPlus) > 0 && newBalance > Number(party.creditLimitPlus)) {
                throw new common_1.BadRequestException(`İşlem limit engeline takıldı. Yapılacak ödeme/harcama firmanın belirlediğiniz limitini aşıyor.`);
            }
            const prefix = dto.type === 'in' ? 'MKB' : 'TDY';
            const code = await this.sequenceGenerator.generateTransactionCode(queryRunner, prefix);
            const tx = queryRunner.manager.create(transaction_entity_1.Transaction, {
                code, partyId: dto.partyId, commercialAccountId: dto.commercialAccountId,
                amount: dto.amount, currencyId: dto.currencyId || null, exchangeRate,
                type: dto.type, referenceType: dto.referenceType || null, referenceId: dto.referenceId || null,
                date: dto.date, description: dto.description || null, status: 'completed', createdBy: userId,
            });
            const savedTx = await queryRunner.manager.save(tx);
            await queryRunner.manager.update(party_entity_1.Party, party.id, { balance: newBalance, updatedBy: userId });
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
    async cancel(id, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const tx = await queryRunner.manager.findOne(transaction_entity_1.Transaction, { where: { id } });
            if (!tx || tx.status === 'cancelled')
                throw new common_1.BadRequestException('Sadece tamamlanmış aktif işlemler iptal edilebilir.');
            const party = await queryRunner.manager.findOne(party_entity_1.Party, { where: { id: tx.partyId } });
            if (!party)
                throw new common_1.NotFoundException('Cari hesap bulunamadı, işlem iptal edilemez.');
            const tlAmount = Number(tx.amount) * Number(tx.exchangeRate);
            const currentBalance = Number(party.balance);
            const newBalance = tx.type === 'in' ? currentBalance + tlAmount : currentBalance - tlAmount;
            await queryRunner.manager.update(party_entity_1.Party, party.id, { balance: newBalance, updatedBy: userId });
            await queryRunner.manager.update(transaction_entity_1.Transaction, tx.id, { status: 'cancelled', updatedBy: userId });
            await queryRunner.commitTransaction();
            return { success: true, message: 'Muhasebe fişi ve cari hareketi geri alındı.' };
        }
        catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getStatus() {
        const firstDayOfMonth = (0, dayjs_1.default)().startOf('month').toDate();
        const stats = await this.txRepo.createQueryBuilder('tx')
            .select("SUM(CASE WHEN tx.type = 'in' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "income")
            .addSelect("SUM(CASE WHEN tx.type = 'out' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "expense")
            .addSelect("COUNT(*)", "count")
            .where("tx.date >= :date", { date: date_utils_1.DateUtils.formatDate(firstDayOfMonth) })
            .andWhere("tx.status != 'cancelled'")
            .getRawOne();
        return {
            monthlyIncome: Number(stats.income || 0),
            monthlyExpense: Number(stats.expense || 0),
            count: Number(stats.count || 0),
            totalVolume: Number(stats.income || 0) + Number(stats.expense || 0),
        };
    }
    async getDailyTrends() {
        const sevenDaysAgo = (0, dayjs_1.default)().subtract(7, 'day').toDate();
        return await this.txRepo.createQueryBuilder('tx')
            .select("DATE(tx.date)", "day")
            .addSelect("SUM(CASE WHEN tx.type = 'in' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "income")
            .addSelect("SUM(CASE WHEN tx.type = 'out' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "expense")
            .where("tx.date >= :date", { date: date_utils_1.DateUtils.formatDate(sevenDaysAgo) })
            .andWhere("tx.status != 'cancelled'")
            .groupBy("DATE(tx.date)")
            .orderBy("day", "ASC")
            .getRawMany();
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map