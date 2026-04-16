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
const decimal_js_1 = require("decimal.js");
const transaction_entity_1 = require("./entities/transaction.entity");
const party_entity_1 = require("../../parties/entities/party.entity");
const currency_entity_1 = require("../currencies/entities/currency.entity");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
const ledger_entity_1 = require("../../parties/entities/ledger.entity");
const date_utils_1 = require("../../../common/utils/date.utils");
const finance_helper_1 = require("../../../common/utils/finance.helper");
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
        if (query.search) {
            qb.andWhere('(tx.code LIKE :s OR party.name LIKE :s OR tx.description LIKE :s OR account.name LIKE :s OR account.bankName LIKE :s)', { s: `%${query.search}%` });
        }
        if (query.partyId)
            qb.andWhere('tx.partyId = :partyId', { partyId: query.partyId });
        if (query.type)
            qb.andWhere('tx.type = :type', { type: query.type });
        if (query.status)
            qb.andWhere('tx.status = :status', { status: query.status });
        const allowedSortCols = ['date', 'amount', 'createdAt', 'code', 'party.name', 'account.name'];
        const sortField = allowedSortCols.includes(query.sortBy || '') ? query.sortBy : 'date';
        const finalSortField = sortField.includes('.') ? sortField : `tx.${sortField}`;
        qb.orderBy(finalSortField, query.sortOrder || 'DESC');
        if (sortField !== 'createdAt') {
            qb.addOrderBy('tx.createdAt', 'DESC');
        }
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
            let party = null;
            let exchangeRate = new decimal_js_1.Decimal(1);
            if (dto.partyId) {
                party = await queryRunner.manager.findOne(party_entity_1.Party, {
                    where: { id: dto.partyId },
                    lock: { mode: 'pessimistic_write' }
                });
                if (!party)
                    throw new common_1.NotFoundException('Cari hesap bulunamadı');
            }
            const currency = await queryRunner.manager.findOne(currency_entity_1.Currency, { where: { id: dto.currencyId } });
            exchangeRate = currency ? new decimal_js_1.Decimal(currency.exchangeRate) : new decimal_js_1.Decimal(1);
            const tlAmount = finance_helper_1.FinanceHelper.mul(dto.amount, exchangeRate);
            let newBalance = null;
            if (party) {
                const isSupplierRefund = dto.type === 'in' && party.type === 'provider';
                const isDebit = dto.type === 'out' || isSupplierRefund;
                newBalance = isDebit
                    ? finance_helper_1.FinanceHelper.add(new decimal_js_1.Decimal(party.balance), tlAmount)
                    : finance_helper_1.FinanceHelper.sub(new decimal_js_1.Decimal(party.balance), tlAmount);
                if (dto.type === 'out' && party.creditLimit.gt(0) && newBalance.gt(party.creditLimit)) {
                    throw new common_1.BadRequestException(`İşlem limit engeline takıldı. Yapılacak ödeme/harcama firmanın belirlediğiniz limitini aşıyor.`);
                }
            }
            const prefix = dto.type === 'in' ? 'MKB' : 'TDY';
            const code = await this.sequenceGenerator.generateTransactionCode(queryRunner, prefix);
            const tx = queryRunner.manager.create(transaction_entity_1.Transaction, {
                code, partyId: dto.partyId || undefined, commercialAccountId: dto.commercialAccountId,
                amount: new decimal_js_1.Decimal(dto.amount), currencyId: dto.currencyId || undefined, exchangeRate,
                type: dto.type, referenceType: dto.referenceType || undefined, referenceId: dto.referenceId || undefined,
                date: dto.date, description: dto.description || undefined, status: 'completed', createdBy: userId,
            });
            const savedTx = await queryRunner.manager.save(tx);
            if (party) {
                const isSupplierRefund = dto.type === 'in' && party.type === 'provider';
                const isCredit = dto.type === 'in' && !isSupplierRefund;
                const entryDebit = isCredit ? new decimal_js_1.Decimal(0) : tlAmount;
                const entryCredit = isCredit ? tlAmount : new decimal_js_1.Decimal(0);
                await queryRunner.manager.save(queryRunner.manager.create(ledger_entity_1.AccountingLedger, {
                    date: date_utils_1.DateUtils.getToday(),
                    partyId: party.id,
                    accountId: dto.commercialAccountId,
                    debit: entryDebit,
                    credit: entryCredit,
                    transactionId: savedTx.id,
                    source: dto.type === 'in' ? 'PAYMENT_IN' : 'PAYMENT_OUT',
                    description: dto.description || `Kasa Fişi: ${code}`
                }));
                const sign = (dto.type === 'in' && !isSupplierRefund) ? '-' : '+';
                await queryRunner.manager.createQueryBuilder()
                    .update(party_entity_1.Party)
                    .set({ balance: () => `balance ${sign} ${tlAmount.toString()}` })
                    .where('id = :id', { id: party.id })
                    .execute();
            }
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
            let newBalance = null;
            if (tx.partyId) {
                const party = await queryRunner.manager.findOne(party_entity_1.Party, {
                    where: { id: tx.partyId },
                    lock: { mode: 'pessimistic_write' }
                });
                if (party) {
                    const isSupplierRefund = tx.type === 'in' && party.type === 'provider';
                    const isReverseCredit = (tx.type === 'in' && !isSupplierRefund) ? false : true;
                    const tlAmount = finance_helper_1.FinanceHelper.mul(tx.amount, tx.exchangeRate);
                    const revDebit = isReverseCredit ? new decimal_js_1.Decimal(0) : tlAmount;
                    const revCredit = isReverseCredit ? tlAmount : new decimal_js_1.Decimal(0);
                    await queryRunner.manager.save(queryRunner.manager.create(ledger_entity_1.AccountingLedger, {
                        date: date_utils_1.DateUtils.getToday(),
                        partyId: party.id,
                        accountId: tx.commercialAccountId,
                        debit: revDebit,
                        credit: revCredit,
                        transactionId: tx.id,
                        source: 'CANCEL',
                        description: `İptal Fişi: ${tx.code}`
                    }));
                    const sign = (tx.type === 'in' && !isSupplierRefund) ? '+' : '-';
                    await queryRunner.manager.createQueryBuilder()
                        .update(party_entity_1.Party)
                        .set({ balance: () => `balance ${sign} ${tlAmount.toString()}` })
                        .where('id = :id', { id: party.id })
                        .execute();
                }
            }
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
            .where("tx.date >= :date", { date: date_utils_1.DateUtils.getStartOfDay(firstDayOfMonth) })
            .andWhere("tx.status != 'cancelled'")
            .getRawOne();
        return {
            monthlyIncome: stats.income?.toString() || '0',
            monthlyExpense: stats.expense?.toString() || '0',
            count: Number(stats.count || 0),
            totalVolume: new decimal_js_1.Decimal(stats.income || 0).plus(new decimal_js_1.Decimal(stats.expense || 0)).toString(),
        };
    }
    async getDailyTrends() {
        const sevenDaysAgo = (0, dayjs_1.default)().subtract(7, 'day').toDate();
        return await this.txRepo.createQueryBuilder('tx')
            .select("DATE(tx.date)", "day")
            .addSelect("SUM(CASE WHEN tx.type = 'in' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "income")
            .addSelect("SUM(CASE WHEN tx.type = 'out' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "expense")
            .where("tx.date >= :date", { date: date_utils_1.DateUtils.getStartOfDay(sevenDaysAgo) })
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