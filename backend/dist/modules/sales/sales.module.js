"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sales_controller_1 = require("./sales.controller");
const sales_service_1 = require("./sales.service");
const sale_entity_1 = require("./entities/sale.entity");
const sale_item_entity_1 = require("./entities/sale-item.entity");
const sale_type_entity_1 = require("./entities/sale-type.entity");
const sale_sequence_entity_1 = require("./entities/sale-sequence.entity");
const sale_installment_entity_1 = require("./entities/sale-installment.entity");
const party_entity_1 = require("../parties/entities/party.entity");
const inventory_module_1 = require("../inventory/inventory.module");
const logs_module_1 = require("../logs/logs.module");
const inventory_sale_listener_1 = require("./listeners/inventory-sale.listener");
const finance_sale_listener_1 = require("./listeners/finance-sale.listener");
const ledger_entity_1 = require("../parties/entities/ledger.entity");
const transaction_entity_1 = require("../finance/transactions/entities/transaction.entity");
const common_module_1 = require("../../common/common.module");
const sales_reports_service_1 = require("./sales-reports.service");
const sales_transactions_service_1 = require("./sales-transactions.service");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sale_entity_1.Sale, sale_item_entity_1.SaleItem, sale_type_entity_1.SaleType, sale_sequence_entity_1.SaleSequence, sale_installment_entity_1.SaleInstallment, party_entity_1.Party, ledger_entity_1.AccountingLedger, transaction_entity_1.Transaction
            ]),
            common_module_1.CommonModule,
            inventory_module_1.InventoryModule,
            logs_module_1.LogsModule,
        ],
        controllers: [sales_controller_1.SalesController],
        providers: [
            sales_service_1.SalesService,
            sales_reports_service_1.SalesReportsService,
            sales_transactions_service_1.SalesTransactionsService,
            inventory_sale_listener_1.InventorySaleListener,
            finance_sale_listener_1.FinanceSaleListener
        ],
        exports: [sales_service_1.SalesService, sales_reports_service_1.SalesReportsService, sales_transactions_service_1.SalesTransactionsService],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map