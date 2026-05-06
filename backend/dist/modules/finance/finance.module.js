"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const currencies_controller_1 = require("./currencies/currencies.controller");
const currencies_service_1 = require("./currencies/currencies.service");
const accounts_controller_1 = require("./accounts/accounts.controller");
const accounts_service_1 = require("./accounts/accounts.service");
const transactions_controller_1 = require("./transactions/transactions.controller");
const transactions_service_1 = require("./transactions/transactions.service");
const finance_listener_1 = require("./listeners/finance.listener");
const currency_entity_1 = require("./currencies/entities/currency.entity");
const commercial_account_entity_1 = require("./accounts/entities/commercial-account.entity");
const transaction_entity_1 = require("./transactions/entities/transaction.entity");
const transaction_sequence_entity_1 = require("./transactions/entities/transaction-sequence.entity");
const party_entity_1 = require("../parties/entities/party.entity");
const common_module_1 = require("../../common/common.module");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([currency_entity_1.Currency, commercial_account_entity_1.CommercialAccount, transaction_entity_1.Transaction, transaction_sequence_entity_1.TransactionSequence, party_entity_1.Party]),
            common_module_1.CommonModule,
        ],
        controllers: [currencies_controller_1.CurrenciesController, accounts_controller_1.AccountsController, transactions_controller_1.TransactionsController],
        providers: [currencies_service_1.CurrenciesService, accounts_service_1.AccountsService, transactions_service_1.TransactionsService, finance_listener_1.FinanceListener],
        exports: [currencies_service_1.CurrenciesService, accounts_service_1.AccountsService, transactions_service_1.TransactionsService],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map