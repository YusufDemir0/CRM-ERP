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
exports.CurrenciesController = void 0;
const common_1 = require("@nestjs/common");
const currencies_service_1 = require("./currencies.service");
const finance_dto_1 = require("../dto/finance.dto");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
let CurrenciesController = class CurrenciesController {
    constructor(currenciesService) {
        this.currenciesService = currenciesService;
    }
    findAll(query) { return this.currenciesService.findAll(query); }
    getDefault() { return this.currenciesService.getDefault(); }
    findOne(id) { return this.currenciesService.findOne(id); }
    create(dto, userId) { return this.currenciesService.create(dto, userId); }
    update(id, dto, userId) {
        return this.currenciesService.update(id, dto, userId);
    }
    setDefault(id) {
        return this.currenciesService.setDefault(id);
    }
    remove(id) {
        return this.currenciesService.delete(id);
    }
};
exports.CurrenciesController = CurrenciesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], CurrenciesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('default'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CurrenciesController.prototype, "getDefault", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CurrenciesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateCurrencyDto, Number]),
    __metadata("design:returntype", void 0)
], CurrenciesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, finance_dto_1.UpdateCurrencyDto, Number]),
    __metadata("design:returntype", void 0)
], CurrenciesController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/default'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CurrenciesController.prototype, "setDefault", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CurrenciesController.prototype, "remove", null);
exports.CurrenciesController = CurrenciesController = __decorate([
    (0, common_1.Controller)('currencies'),
    __metadata("design:paramtypes", [currencies_service_1.CurrenciesService])
], CurrenciesController);
//# sourceMappingURL=currencies.controller.js.map