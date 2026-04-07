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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const stocks_service_1 = require("./stocks.service");
const inventory_dto_1 = require("../dto/inventory.dto");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let StocksController = class StocksController {
    constructor(stocksService) {
        this.stocksService = stocksService;
    }
    findAll(query) {
        return this.stocksService.findAll(query);
    }
    getCriticalStocks() { return this.stocksService.getCriticalStocks(); }
    getMovements(id, query) {
        return this.stocksService.getMovements(id, query);
    }
    adjustStock(dto, userId) {
        return this.stocksService.adjustStock(dto, userId);
    }
    getStatus() { return this.stocksService.getStatus(); }
};
exports.StocksController = StocksController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('stok_goruntuleme'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.StocksQueryDto]),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('critical'),
    (0, permissions_decorator_1.RequirePermissions)('stok_goruntuleme'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "getCriticalStocks", null);
__decorate([
    (0, common_1.Get)(':id/movements'),
    (0, permissions_decorator_1.RequirePermissions)('stok_goruntuleme'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Post)('adjust'),
    (0, permissions_decorator_1.RequirePermissions)('stok_duzenleme'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.StockAdjustmentDto, Number]),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.RequirePermissions)('stok_goruntuleme'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "getStatus", null);
exports.StocksController = StocksController = __decorate([
    (0, common_1.Controller)('stocks'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [stocks_service_1.StocksService])
], StocksController);
//# sourceMappingURL=stocks.controller.js.map