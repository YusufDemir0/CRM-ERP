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
exports.ProductionController = void 0;
const common_1 = require("@nestjs/common");
const production_service_1 = require("./production.service");
const production_dto_1 = require("./dto/production.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ProductionController = class ProductionController {
    constructor(prodService) {
        this.prodService = prodService;
    }
    findAllBoms(query) { return this.prodService.findAllBoms(query); }
    findOneBom(id) { return this.prodService.findOneBom(id); }
    createBom(dto, userId) {
        return this.prodService.createBom(dto, userId);
    }
    updateBom(id, dto, userId) {
        return this.prodService.updateBom(id, dto, userId);
    }
    deleteBom(id) { return this.prodService.deleteBom(id); }
    findAllOrders(query) { return this.prodService.findAllOrders(query); }
    findOneOrder(id) { return this.prodService.findOneOrder(id); }
    createOrder(dto, userId) {
        return this.prodService.createOrder(dto, userId);
    }
    updateOrder(id, dto, userId) {
        return this.prodService.updateOrder(id, dto, userId);
    }
    deleteOrder(id) { return this.prodService.deleteOrder(id); }
    getStatus() { return this.prodService.getStatus(); }
};
exports.ProductionController = ProductionController;
__decorate([
    (0, common_1.Get)('boms'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [production_dto_1.BomQueryDto]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "findAllBoms", null);
__decorate([
    (0, common_1.Get)('boms/:id'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "findOneBom", null);
__decorate([
    (0, common_1.Post)('boms'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [production_dto_1.CreateBomDto, String]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "createBom", null);
__decorate([
    (0, common_1.Put)('boms/:id'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, production_dto_1.UpdateBomDto, String]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "updateBom", null);
__decorate([
    (0, common_1.Delete)('boms/:id'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "deleteBom", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [production_dto_1.ProductionOrderQueryDto]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "findAllOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "findOneOrder", null);
__decorate([
    (0, common_1.Post)('orders'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [production_dto_1.CreateProductionOrderDto, String]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Put)('orders/:id'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, production_dto_1.UpdateProductionOrderDto, String]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Delete)('orders/:id'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "deleteOrder", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.RequirePermissions)('PRODUCTION_VIEW'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "getStatus", null);
exports.ProductionController = ProductionController = __decorate([
    (0, common_1.Controller)('production'),
    __metadata("design:paramtypes", [production_service_1.ProductionService])
], ProductionController);
//# sourceMappingURL=production.controller.js.map