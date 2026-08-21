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
const sale_entity_1 = require("../../sales/entities/sale.entity");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
const finance_dto_1 = require("../dto/finance.dto");
const ledger_entity_1 = require("../../parties/entities/ledger.entity");
const date_utils_1 = require("../../../common/utils/date.utils");
const finance_helper_1 = require("../../../common/utils/finance.helper");
const dayjs_1 = __importDefault(require("dayjs"));
const transactional_1 = require("@nestjs-cls/transactional");
const transaction_context_service_1 = require("../../../common/services/transaction-context.service");
const sql_helper_1 = require("../../../common/utils/sql.helper");
const department_entity_1 = require("../../departments/entities/department.entity");
const commercial_account_entity_1 = require("../accounts/entities/commercial-account.entity");
let TransactionsService = class TransactionsService {
    constructor(txRepo, dataSource, sequenceGenerator, transactionContext) {
        this.txRepo = txRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.transactionContext = transactionContext;
    }
    async findAll(query, currentUser) {
        const qb = this.txRepo.createQueryBuilder('tx')
            .select([
            'tx.id', 'tx.code', 'tx.type', 'tx.amount', 'tx.date',
            'tx.status', 'tx.description', 'tx.exchangeRate', 'tx.createdAt'
        ])
            .leftJoin('tx.party', 'party')
            .addSelect(['party.id', 'party.name'])
            .leftJoin('tx.commercialAccount', 'commercialAccount')
            .addSelect(['commercialAccount.id', 'commercialAccount.name', 'commercialAccount.bankName'])
            .leftJoin('tx.currency', 'currency')
            .addSelect(['currency.id', 'currency.symbol', 'currency.code']);
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.andWhere('(tx.code LIKE :s OR party.name LIKE :s OR tx.description LIKE :s OR commercialAccount.name LIKE :s OR commercialAccount.bankName LIKE :s)', { s });
        }
        if (query.partyId)
            qb.andWhere('tx.partyId = :partyId', { partyId: query.partyId });
        if (query.type)
            qb.andWhere('tx.type = :type', { type: query.type });
        if (query.status)
            qb.andWhere('tx.status = :status', { status: query.status });
        let deptAccountId = null;
        if (currentUser && !currentUser.isSystemAdmin) {
            if (currentUser.departmentId) {
                const department = await this.dataSource.getRepository(department_entity_1.Department).findOne({
                    where: { id: String(currentUser.departmentId) }
                });
                deptAccountId = department?.commercialAccountId || null;
            }
            if (deptAccountId) {
                qb.andWhere('tx.commercialAccountId = :deptAccountId', { deptAccountId });
            }
            else {
                qb.andWhere('1 = 0');
            }
        }
        else {
            if (query.commercialAccountId) {
                qb.andWhere('tx.commercialAccountId = :commercialAccountId', { commercialAccountId: query.commercialAccountId });
            }
            if (query.departmentId) {
                const department = await this.dataSource.getRepository(department_entity_1.Department).findOne({
                    where: { id: String(query.departmentId) }
                });
                if (department && department.commercialAccountId) {
                    qb.andWhere('tx.commercialAccountId = :deptFilterAccountId', { deptFilterAccountId: String(department.commercialAccountId) });
                }
                else {
                    qb.andWhere('1 = 0');
                }
            }
        }
        const allowedSortCols = ['date', 'amount', 'createdAt', 'code', 'party.name', 'commercialAccount.name', 'status'];
        const sortField = allowedSortCols.includes(query.sortBy || '') ? query.sortBy : 'date';
        const finalSortField = sortField.includes('.') ? sortField : `tx.${sortField}`;
        qb.orderBy(finalSortField, query.sortOrderSafe);
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
        const tx = await this.transactionContext.manager.findOne(transaction_entity_1.Transaction, {
            where: { id: String(id) },
            relations: ['party', 'commercialAccount', 'currency'],
        });
        if (!tx)
            throw new common_1.NotFoundException('İşlem bulunamadı');
        return tx;
    }
    async create(dto, userId) {
        const manager = this.transactionContext.manager;
        let party = null;
        let exchangeRate = new decimal_js_1.Decimal(1);
        const p = dto.partyId ? await manager.findOne(party_entity_1.Party, { where: { id: String(dto.partyId) } }) : null;
        if (p && p.type === 'provider' && dto.type === 'in') {
            console.warn(`Tedarikçiden tahsilat işlemi yapılıyor: ${p.name}`);
        }
        if (dto.partyId) {
            party = await manager.findOne(party_entity_1.Party, {
                where: { id: String(dto.partyId) },
                lock: { mode: 'pessimistic_write' }
            });
            if (!party)
                throw new common_1.NotFoundException('Cari hesap bulunamadı');
        }
        const currency = dto.currencyId ? await manager.findOne(currency_entity_1.Currency, { where: { id: String(dto.currencyId) } }) : null;
        exchangeRate = currency ? new decimal_js_1.Decimal(currency.exchangeRate) : new decimal_js_1.Decimal(1);
        const tlAmount = finance_helper_1.FinanceHelper.mul(dto.amount, exchangeRate);
        if (party) {
            const isSupplierRefund = dto.type === 'in' && party.type === 'provider';
            const isDebit = dto.type === 'out' || isSupplierRefund;
            const newBalance = isDebit
                ? finance_helper_1.FinanceHelper.add(new decimal_js_1.Decimal(party.balance), tlAmount)
                : finance_helper_1.FinanceHelper.sub(new decimal_js_1.Decimal(party.balance), tlAmount);
            if (dto.type === 'out' && party.creditLimit.gt(0) && newBalance.gt(party.creditLimit)) {
                throw new common_1.BadRequestException(`İşlem limit engeline takıldı. Yapılacak ödeme/harcama firmanın belirlediğiniz limitini aşıyor.`);
            }
            party.balance = newBalance;
            await manager.save(party_entity_1.Party, party);
        }
        const prefix = dto.type === 'in' ? 'MKB' : 'TDY';
        const code = await this.sequenceGenerator.generateTransactionCode(manager, prefix);
        const tx = manager.create(transaction_entity_1.Transaction, {
            code, partyId: dto.partyId ? String(dto.partyId) : undefined, commercialAccountId: dto.commercialAccountId ? String(dto.commercialAccountId) : undefined,
            amount: new decimal_js_1.Decimal(dto.amount), currencyId: dto.currencyId ? String(dto.currencyId) : undefined, exchangeRate,
            type: dto.type, referenceType: dto.referenceType, referenceId: dto.referenceId ? String(dto.referenceId) : undefined,
            date: dto.date, description: dto.description || undefined, status: 'completed', createdBy: userId,
        });
        const savedTx = await manager.save(tx);
        if (party) {
            const isSupplierRefund = dto.type === 'in' && party.type === 'provider';
            const isCredit = dto.type === 'in' && !isSupplierRefund;
            const entryDebit = isCredit ? new decimal_js_1.Decimal(0) : tlAmount;
            const entryCredit = isCredit ? tlAmount : new decimal_js_1.Decimal(0);
            await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                date: date_utils_1.DateUtils.getToday(),
                partyId: party.id,
                accountId: dto.commercialAccountId,
                debit: entryDebit,
                credit: entryCredit,
                transactionId: savedTx.id,
                source: dto.type === 'in' ? 'PAYMENT_IN' : 'PAYMENT_OUT',
                description: dto.description || `Kasa Fişi: ${code}`
            }));
            if (isCredit) {
                let remainingPayment = new decimal_js_1.Decimal(dto.amount);
                const targetSales = [];
                if (dto.referenceId && (dto.referenceType === 'sale' || dto.referenceType === 'sale_deposit' || !dto.referenceType)) {
                    const specificSale = await manager.findOne(sale_entity_1.Sale, {
                        where: { id: String(dto.referenceId), partyId: party.id },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (specificSale && ['approved', 'shipped', 'invoiced'].includes(specificSale.status)) {
                        targetSales.push(specificSale);
                    }
                }
                const otherUnpaidSales = await manager.find(sale_entity_1.Sale, {
                    where: [
                        { partyId: party.id, status: 'approved' },
                        { partyId: party.id, status: 'shipped' },
                        { partyId: party.id, status: 'invoiced' },
                    ],
                    order: { createdAt: 'ASC' },
                });
                for (const s of otherUnpaidSales) {
                    if (!targetSales.some((ts) => String(ts.id) === String(s.id))) {
                        targetSales.push(s);
                    }
                }
                for (const sale of targetSales) {
                    if (remainingPayment.lte(0.0001))
                        break;
                    const grandTotal = new decimal_js_1.Decimal(sale.grandTotal || 0);
                    const paidAmount = new decimal_js_1.Decimal(sale.paidAmount || 0);
                    const remainingDebtOnSale = grandTotal.sub(paidAmount).toDecimalPlaces(2, decimal_js_1.Decimal.ROUND_HALF_UP);
                    if (remainingDebtOnSale.gt(0)) {
                        const txExchangeRate = exchangeRate;
                        const saleExchangeRate = new decimal_js_1.Decimal(sale.exchangeRate || 1);
                        const remainingPaymentInTl = remainingPayment.mul(txExchangeRate);
                        const remainingPaymentInSaleCurrency = remainingPaymentInTl
                            .div(saleExchangeRate)
                            .toDecimalPlaces(2, decimal_js_1.Decimal.ROUND_DOWN);
                        const allocationInSaleCurrency = decimal_js_1.Decimal.min(remainingDebtOnSale, remainingPaymentInSaleCurrency);
                        if (allocationInSaleCurrency.gt(0)) {
                            const newPaidAmount = paidAmount.add(allocationInSaleCurrency).toDecimalPlaces(2, decimal_js_1.Decimal.ROUND_HALF_UP);
                            sale.paidAmount = newPaidAmount;
                            await manager.save(sale_entity_1.Sale, sale);
                            const allocationInTxCurrency = allocationInSaleCurrency
                                .mul(saleExchangeRate)
                                .div(txExchangeRate)
                                .toDecimalPlaces(2, decimal_js_1.Decimal.ROUND_HALF_UP);
                            remainingPayment = remainingPayment.sub(allocationInTxCurrency);
                        }
                    }
                }
            }
        }
        return this.findOne(String(savedTx.id));
    }
    async cancel(id, userId) {
        const manager = this.transactionContext.manager;
        const tx = await manager.findOne(transaction_entity_1.Transaction, { where: { id: String(id) } });
        if (!tx || tx.status === 'cancelled')
            throw new common_1.BadRequestException('Sadece tamamlanmış aktif işlemler iptal edilebilir.');
        if (tx.partyId) {
            const party = await manager.findOne(party_entity_1.Party, {
                where: { id: String(tx.partyId) },
                lock: { mode: 'pessimistic_write' }
            });
            if (party) {
                const isSupplierRefund = tx.type === 'in' && party.type === 'provider';
                const isReverseCredit = (tx.type === 'in' && !isSupplierRefund) ? false : true;
                const tlAmount = finance_helper_1.FinanceHelper.mul(tx.amount, tx.exchangeRate);
                const revDebit = isReverseCredit ? new decimal_js_1.Decimal(0) : tlAmount;
                const revCredit = isReverseCredit ? tlAmount : new decimal_js_1.Decimal(0);
                await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                    date: date_utils_1.DateUtils.getToday(),
                    partyId: party.id,
                    accountId: tx.commercialAccountId,
                    debit: revDebit,
                    credit: revCredit,
                    transactionId: tx.id,
                    source: 'CANCEL',
                    description: `İptal Fişi: ${tx.code}`
                }));
                if (!isReverseCredit) {
                    let amountToRevert = new decimal_js_1.Decimal(tx.amount);
                    console.log(`[FIFO Payment Cancel] Reverting payment amount ${tx.amount} ${tx.currencyId || 'TRY'} for customer ${party.name}`);
                    const paidSales = await manager.find(sale_entity_1.Sale, {
                        where: [
                            { partyId: party.id, status: 'approved' },
                            { partyId: party.id, status: 'shipped' },
                            { partyId: party.id, status: 'invoiced' }
                        ],
                        order: { createdAt: 'DESC' }
                    });
                    for (const sale of paidSales) {
                        if (amountToRevert.lte(0))
                            break;
                        const paidAmount = new decimal_js_1.Decimal(sale.paidAmount || 0);
                        if (paidAmount.gt(0)) {
                            const txExchangeRate = new decimal_js_1.Decimal(tx.exchangeRate || 1);
                            const saleExchangeRate = new decimal_js_1.Decimal(sale.exchangeRate || 1);
                            const amountToRevertInTl = amountToRevert.mul(txExchangeRate);
                            const amountToRevertInSaleCurrency = amountToRevertInTl.div(saleExchangeRate);
                            const revertInSaleCurrency = decimal_js_1.Decimal.min(paidAmount, amountToRevertInSaleCurrency);
                            if (revertInSaleCurrency.gt(0)) {
                                const newPaidAmount = paidAmount.sub(revertInSaleCurrency);
                                sale.paidAmount = newPaidAmount;
                                await manager.save(sale_entity_1.Sale, sale);
                                console.log(`[FIFO Payment Cancel] Reverted ${revertInSaleCurrency} ${sale.currencyId} from Sale Code ${sale.code} (Remaining Paid: ${newPaidAmount})`);
                                const revertInTxCurrency = revertInSaleCurrency.mul(saleExchangeRate).div(txExchangeRate);
                                amountToRevert = amountToRevert.sub(revertInTxCurrency);
                            }
                        }
                    }
                }
                const currentBalance = new decimal_js_1.Decimal(party.balance || 0);
                party.balance = isReverseCredit
                    ? currentBalance.sub(tlAmount)
                    : currentBalance.add(tlAmount);
                party.updatedBy = userId;
                await manager.save(party_entity_1.Party, party);
            }
        }
        tx.status = 'cancelled';
        tx.updatedBy = userId;
        await manager.save(transaction_entity_1.Transaction, tx);
        return { success: true, message: 'Muhasebe fişi ve cari hareketi geri alındı.' };
    }
    async transfer(dto, userId) {
        const manager = this.transactionContext.manager;
        const fromAccount = await manager.findOne(commercial_account_entity_1.CommercialAccount, { where: { id: String(dto.fromAccountId) } });
        if (!fromAccount)
            throw new common_1.NotFoundException('Kaynak hesap bulunamadı');
        const toAccount = await manager.findOne(commercial_account_entity_1.CommercialAccount, { where: { id: String(dto.toAccountId) } });
        if (!toAccount)
            throw new common_1.NotFoundException('Hedef hesap bulunamadı');
        const amountDecimal = new decimal_js_1.Decimal(dto.amount);
        if (amountDecimal.lte(0))
            throw new common_1.BadRequestException('Transfer tutarı 0 veya daha küçük olamaz');
        const currencyId = dto.currencyId || fromAccount.currencyId;
        const currency = await manager.findOne(currency_entity_1.Currency, { where: { id: String(currencyId) } });
        if (!currency)
            throw new common_1.NotFoundException('Para birimi bulunamadı');
        const exchangeRate = new decimal_js_1.Decimal(currency.exchangeRate);
        const transferCode = await this.sequenceGenerator.generateTransactionCode(manager, 'TRNS');
        const outTx = this.txRepo.create({
            code: `${transferCode}-OUT`,
            commercialAccountId: fromAccount.id,
            amount: amountDecimal,
            currencyId: currency.id,
            exchangeRate,
            type: 'out',
            referenceType: 'transfer',
            referenceId: null,
            date: dto.date,
            description: dto.description || `${fromAccount.name} hesabından ${toAccount.name} hesabına transfer`,
            status: 'completed',
            createdBy: userId,
        });
        await manager.save(transaction_entity_1.Transaction, outTx);
        const inTx = this.txRepo.create({
            code: `${transferCode}-IN`,
            commercialAccountId: toAccount.id,
            amount: amountDecimal,
            currencyId: currency.id,
            exchangeRate,
            type: 'in',
            referenceType: 'transfer',
            referenceId: null,
            date: dto.date,
            description: dto.description || `${fromAccount.name} hesabından ${toAccount.name} hesabına transfer`,
            status: 'completed',
            createdBy: userId,
        });
        await manager.save(transaction_entity_1.Transaction, inTx);
        return { success: true, message: 'Transfer başarıyla gerçekleştirildi.' };
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
            monthlyIncome: new decimal_js_1.Decimal(stats.income || 0).toString(),
            monthlyExpense: new decimal_js_1.Decimal(stats.expense || 0).toString(),
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
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateTransactionDto, String]),
    __metadata("design:returntype", Promise)
], TransactionsService.prototype, "create", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TransactionsService.prototype, "cancel", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateTransferDto, String]),
    __metadata("design:returntype", Promise)
], TransactionsService.prototype, "transfer", null);
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService,
        transaction_context_service_1.TransactionContextService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map