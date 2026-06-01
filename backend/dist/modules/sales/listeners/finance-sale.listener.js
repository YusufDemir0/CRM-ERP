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
var FinanceSaleListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceSaleListener = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const ledger_entity_1 = require("../../parties/entities/ledger.entity");
const party_entity_1 = require("../../parties/entities/party.entity");
const transaction_entity_1 = require("../../finance/transactions/entities/transaction.entity");
const sale_entity_1 = require("../entities/sale.entity");
const decimal_js_1 = require("decimal.js");
const finance_helper_1 = require("../../../common/utils/finance.helper");
const date_utils_1 = require("../../../common/utils/date.utils");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
const rabbitmq_service_1 = require("../../../common/services/rabbitmq.service");
let FinanceSaleListener = FinanceSaleListener_1 = class FinanceSaleListener {
    constructor(dataSource, sequenceGenerator, rabbitMQService) {
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.rabbitMQService = rabbitMQService;
        this.logger = new common_1.Logger(FinanceSaleListener_1.name);
    }
    async onModuleInit() {
        this.setupConsumer();
        this.setupCancelConsumer();
    }
    setupConsumer() {
        const trySubscribe = async () => {
            if (this.rabbitMQService.isConnected()) {
                await this.rabbitMQService.subscribe('ermay.finance.sale_approved', 'sale.approved', async (msg) => {
                    try {
                        const payload = JSON.parse(msg.content.toString());
                        payload.tlGrandTotal = new decimal_js_1.Decimal(payload.tlGrandTotal || 0);
                        payload.deposit = new decimal_js_1.Decimal(payload.deposit || 0);
                        await this.handleFinanceLogic(payload);
                    }
                    catch (err) {
                        this.logger.error(`Error processing finance logic: ${err.message}`);
                        throw err;
                    }
                });
            }
            else {
                setTimeout(trySubscribe, 2000);
            }
        };
        trySubscribe();
    }
    async handleFinanceLogic(payload) {
        const { sale, tlGrandTotal, deposit, commercialAccountId, userId } = payload;
        await this.dataSource.transaction(async (qr) => {
            const exists = await qr.findOne(ledger_entity_1.AccountingLedger, {
                where: { source: 'SALE', transactionId: sale.id }
            });
            if (exists) {
                this.logger.warn(`Idempotency: Finance logic for sale.id=${sale.id} already processed. Skipping.`);
                return;
            }
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
                    const deposit = new decimal_js_1.Decimal(sale.deposit || 0);
                    if (commercialAccountId && deposit.gt(0)) {
                        const tlDeposit = finance_helper_1.FinanceHelper.mul(deposit, sale.exchangeRate);
                        const txCode = await this.sequenceGenerator.generateTransactionCode(qr, 'MKB');
                        await qr.save(qr.create(transaction_entity_1.Transaction, {
                            code: txCode,
                            partyId: party.id,
                            commercialAccountId,
                            amount: deposit,
                            currencyId: sale.currencyId,
                            exchangeRate: sale.exchangeRate,
                            type: 'in',
                            referenceType: 'sale_deposit',
                            referenceId: sale.id,
                            date: date_utils_1.DateUtils.getToday(),
                            description: `${sale.code} Nolu Satış Kaporası / Ön Ödemesi`,
                            status: 'completed',
                            createdBy: userId
                        }));
                        await qr.save(qr.create(ledger_entity_1.AccountingLedger, {
                            date: date_utils_1.DateUtils.getToday(),
                            partyId: party.id,
                            accountId: commercialAccountId,
                            debit: new decimal_js_1.Decimal(0),
                            credit: tlDeposit,
                            transactionId: sale.id,
                            source: 'DEPOSIT',
                            description: `${sale.code} Satış Kaporası`
                        }));
                        party.balance = finance_helper_1.FinanceHelper.sub(party.balance, tlDeposit);
                        await qr.update(sale_entity_1.Sale, sale.id, { paidAmount: deposit });
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
        });
    }
    setupCancelConsumer() {
        const trySubscribe = async () => {
            if (this.rabbitMQService.isConnected()) {
                await this.rabbitMQService.subscribe('ermay.finance.sale_cancelled', 'sale.cancelled', async (msg) => {
                    try {
                        const payload = JSON.parse(msg.content.toString());
                        payload.tlGrandTotal = new decimal_js_1.Decimal(payload.tlGrandTotal || 0);
                        payload.tlDeposit = new decimal_js_1.Decimal(payload.tlDeposit || 0);
                        await this.handleFinanceCancelLogic(payload);
                    }
                    catch (err) {
                        this.logger.error(`Error processing finance cancel logic: ${err.message}`);
                        throw err;
                    }
                });
            }
            else {
                setTimeout(trySubscribe, 2000);
            }
        };
        trySubscribe();
    }
    async handleFinanceCancelLogic(payload) {
        const { sale, tlGrandTotal, tlDeposit, userId } = payload;
        await this.dataSource.transaction(async (qr) => {
            const exists = await qr.findOne(ledger_entity_1.AccountingLedger, {
                where: { source: 'CANCEL_SALE', transactionId: sale.id }
            });
            if (exists) {
                this.logger.warn(`Idempotency: Finance cancel logic for sale.id=${sale.id} already processed. Skipping.`);
                return;
            }
            try {
                const party = await qr.findOne(party_entity_1.Party, {
                    where: { id: sale.partyId },
                    lock: { mode: 'pessimistic_write' }
                });
                if (party) {
                    party.balance = finance_helper_1.FinanceHelper.sub(party.balance, tlGrandTotal);
                    await qr.save(qr.create(ledger_entity_1.AccountingLedger, {
                        date: date_utils_1.DateUtils.getToday(),
                        partyId: party.id,
                        debit: new decimal_js_1.Decimal(0),
                        credit: tlGrandTotal,
                        transactionId: sale.id,
                        source: 'CANCEL_SALE',
                        description: `${sale.code} Satış İptali - Borç Revert`
                    }));
                    const depositTx = await qr.findOne(transaction_entity_1.Transaction, {
                        where: { referenceId: sale.id, type: 'in' }
                    });
                    if (depositTx) {
                        const tlDepositActual = finance_helper_1.FinanceHelper.mul(depositTx.amount, depositTx.exchangeRate);
                        await qr.save(qr.create(ledger_entity_1.AccountingLedger, {
                            date: date_utils_1.DateUtils.getToday(),
                            partyId: party.id,
                            accountId: depositTx.commercialAccountId,
                            debit: tlDepositActual,
                            credit: new decimal_js_1.Decimal(0),
                            transactionId: sale.id,
                            source: 'CANCEL_DEPOSIT',
                            description: `${sale.code} Tahsilat İptali - Alacak Revert`
                        }));
                        depositTx.status = 'cancelled';
                        depositTx.updatedBy = userId;
                        await qr.save(transaction_entity_1.Transaction, depositTx);
                        party.balance = finance_helper_1.FinanceHelper.add(party.balance, tlDepositActual);
                    }
                    party.updatedBy = userId || null;
                    await qr.save(party_entity_1.Party, party);
                }
                this.logger.log(`Finance cancel logic completed for sale ${sale.code}`);
            }
            catch (err) {
                this.logger.error(`Failed to process finance cancel for sale ${payload.sale.code}: ${err.message}`);
                throw err;
            }
        });
    }
};
exports.FinanceSaleListener = FinanceSaleListener;
exports.FinanceSaleListener = FinanceSaleListener = FinanceSaleListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        sequence_generator_service_1.SequenceGeneratorService,
        rabbitmq_service_1.RabbitMQService])
], FinanceSaleListener);
//# sourceMappingURL=finance-sale.listener.js.map