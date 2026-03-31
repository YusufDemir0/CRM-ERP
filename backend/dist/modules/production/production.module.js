"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const production_controller_1 = require("./production.controller");
const production_service_1 = require("./production.service");
const bom_entity_1 = require("./entities/bom.entity");
const bom_item_entity_1 = require("./entities/bom-item.entity");
const production_order_entity_1 = require("./entities/production-order.entity");
const production_sequence_entity_1 = require("./entities/production-sequence.entity");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
let ProductionModule = class ProductionModule {
};
exports.ProductionModule = ProductionModule;
exports.ProductionModule = ProductionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([bom_entity_1.Bom, bom_item_entity_1.BomItem, production_order_entity_1.ProductionOrder, production_sequence_entity_1.ProductionSequence]),
        ],
        controllers: [production_controller_1.ProductionController],
        providers: [production_service_1.ProductionService, sequence_generator_service_1.SequenceGeneratorService],
        exports: [production_service_1.ProductionService],
    })
], ProductionModule);
//# sourceMappingURL=production.module.js.map