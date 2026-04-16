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
var FinanceSaleListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceSaleListener = void 0;
const common_1 = require("@nestjs/common");
const event_bus_service_1 = require("../../../common/services/event-bus.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ledger_entity_1 = require("../../parties/entities/ledger.entity");
const party_entity_1 = require("../../parties/entities/party.entity");
const transaction_entity_1 = require("../../finance/transactions/entities/transaction.entity");
const decimal_js_1 = require("decimal.js");
const finance_helper_1 = require("../../../common/utils/finance.helper");
const date_utils_1 = require("../../../common/utils/date.utils");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
let FinanceSaleListener = FinanceSaleListener_1 = class FinanceSaleListener {
    constructor(eventBus, dataSource, sequenceGenerator, ledgerRepo, partyRepo, txRepo) {
        this.eventBus = eventBus;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.ledgerRepo = ledgerRepo;
        this.partyRepo = partyRepo;
        this.txRepo = txRepo;
        this.logger = new common_1.Logger(FinanceSaleListener_1.name);
    }
    onModuleInit() {
        this.eventBus.subscribeSync('sale.approved', async (payload) => {
            await this.handleFinanceLogic(payload);
        });
    }
    async handleFinanceLogic(payload) {
        const { sale, tlGrandTotal, deposit, commercialAccountId, userId, manager } = payload;
        const qr = manager || this.dataSource.manager;
        try {
            await qr.save(qr.create(ledger_entity_1.AccountingLedger, {
                date: date_utils_1.DateUtils.getToday(),
                partyId: sale.partyId,
                debit: tlGrandTotal,
                credit: new decimal_js_1.Decimal(0),
                transactionId: sale.id,
                source: 'SALE',
                description: `${sale.code} numaralı Satış Faturası Borçlandırması`
            }));
            const party = await qr.findOne(party_entity_1.Party, {
                where: { id: sale.partyId },
                lock: { mode: 'pessimistic_write' }
            });
            if (party) {
                party.balance = finance_helper_1.FinanceHelper.add(party.balance, tlGrandTotal);
                if (deposit.gt(0) && commercialAccountId) {
                    const txCode = await this.sequenceGenerator.generateTransactionCode(qr, 'MKB');
                    await qr.save(qr.create(transaction_entity_1.Transaction, {
                        code: txCode,
                        partyId: party.id,
                        commercialAccountId,
                        amount: sale.deposit,
                        currencyId: sale.currencyId,
                        exchangeRate: sale.exchangeRate,
                        type: 'in',
                        referenceType: 'sale',
                        referenceId: sale.id,
                        date: date_utils_1.DateUtils.getToday(),
                        description: `${sale.code} Nolu Sipariş Peşinat / Kaporası`,
                        status: 'completed',
                        createdBy: userId
                    }));
                    await qr.save(qr.create(ledger_entity_1.AccountingLedger, {
                        date: date_utils_1.DateUtils.getToday(),
                        partyId: party.id,
                        accountId: commercialAccountId,
                        debit: new decimal_js_1.Decimal(0),
                        credit: deposit,
                        transactionId: sale.id,
                        source: 'DEPOSIT',
                        description: `${sale.code} Sipariş Peşinat Tahsilatı`
                    }));
                    party.balance = finance_helper_1.FinanceHelper.sub(party.balance, deposit);
                }
                party.updatedBy = userId || null;
                await qr.save(party_entity_1.Party, party);
            }
            this.logger.log(`Finance logic completed for sale ${sale.code}`);
        }
        catch (err) {
            this.logger.error(`Failed to process finance for sale ${payload.sale.code}: ${err.message}`);
            throw err;
        }
    }
};
exports.FinanceSaleListener = FinanceSaleListener;
exports.FinanceSaleListener = FinanceSaleListener = FinanceSaleListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(ledger_entity_1.AccountingLedger)),
    __param(4, (0, typeorm_1.InjectRepository)(party_entity_1.Party)),
    __param(5, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [event_bus_service_1.InternalEventBus,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FinanceSaleListener);
//# sourceMappingURL=finance-sale.listener.js.map