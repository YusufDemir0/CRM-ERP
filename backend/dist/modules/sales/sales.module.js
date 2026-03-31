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
const stock_entity_1 = require("../inventory/stocks/entities/stock.entity");
const stock_movement_entity_1 = require("../inventory/stocks/entities/stock-movement.entity");
const party_entity_1 = require("../parties/entities/party.entity");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sale_entity_1.Sale, sale_item_entity_1.SaleItem, sale_type_entity_1.SaleType, sale_sequence_entity_1.SaleSequence,
                stock_entity_1.Stock, stock_movement_entity_1.StockMovement, party_entity_1.Party,
            ]),
        ],
        controllers: [sales_controller_1.SalesController],
        providers: [sales_service_1.SalesService, sequence_generator_service_1.SequenceGeneratorService],
        exports: [sales_service_1.SalesService],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map