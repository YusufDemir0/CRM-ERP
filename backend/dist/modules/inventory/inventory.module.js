"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const finance_module_1 = require("../finance/finance.module");
const logs_module_1 = require("../logs/logs.module");
const items_controller_1 = require("./items/items.controller");
const items_service_1 = require("./items/items.service");
const stocks_controller_1 = require("./stocks/stocks.controller");
const stocks_service_1 = require("./stocks/stocks.service");
const item_entity_1 = require("./items/entities/item.entity");
const item_type_entity_1 = require("./items/entities/item-type.entity");
const item_sequence_entity_1 = require("./items/entities/item-sequence.entity");
const item_code_group_entity_1 = require("./items/entities/item-code-group.entity");
const item_code_sequence_entity_1 = require("./items/entities/item-code-sequence.entity");
const quantity_type_entity_1 = require("./items/entities/quantity-type.entity");
const stock_entity_1 = require("./stocks/entities/stock.entity");
const stock_movement_entity_1 = require("./stocks/entities/stock-movement.entity");
const shipment_entity_1 = require("./stocks/entities/shipment.entity");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
const bom_item_entity_1 = require("../production/entities/bom-item.entity");
const stocks_reports_service_1 = require("./stocks/stocks-reports.service");
const stocks_transactions_service_1 = require("./stocks/stocks-transactions.service");
const items_reports_service_1 = require("./items/items-reports.service");
const items_transactions_service_1 = require("./items/items-transactions.service");
const shipments_controller_1 = require("./stocks/shipments.controller");
const shipments_service_1 = require("./stocks/shipments.service");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                item_entity_1.Item, item_type_entity_1.ItemType, item_sequence_entity_1.ItemSequence, item_code_group_entity_1.ItemCodeGroup,
                item_code_sequence_entity_1.ItemCodeSequence, quantity_type_entity_1.QuantityType, stock_entity_1.Stock, stock_movement_entity_1.StockMovement, shipment_entity_1.Shipment,
                bom_item_entity_1.BomItem
            ]),
            finance_module_1.FinanceModule,
            logs_module_1.LogsModule,
        ],
        controllers: [items_controller_1.ItemsController, stocks_controller_1.StocksController, shipments_controller_1.ShipmentsController],
        providers: [
            items_service_1.ItemsService, items_reports_service_1.ItemsReportsService, items_transactions_service_1.ItemsTransactionsService,
            stocks_service_1.StocksService, stocks_reports_service_1.StocksReportsService, stocks_transactions_service_1.StocksTransactionsService,
            shipments_service_1.ShipmentsService, sequence_generator_service_1.SequenceGeneratorService
        ],
        exports: [
            items_service_1.ItemsService, items_reports_service_1.ItemsReportsService, items_transactions_service_1.ItemsTransactionsService,
            stocks_service_1.StocksService, stocks_reports_service_1.StocksReportsService, stocks_transactions_service_1.StocksTransactionsService,
            shipments_service_1.ShipmentsService, sequence_generator_service_1.SequenceGeneratorService
        ],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map