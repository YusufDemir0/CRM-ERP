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
exports.ItemsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const items_service_1 = require("./items.service");
const inventory_dto_1 = require("../dto/inventory.dto");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let ItemsController = class ItemsController {
    constructor(itemsService) {
        this.itemsService = itemsService;
    }
    async importItems(body, file, userId) {
        if (file) {
            return this.itemsService.importFromExcel(file.buffer, userId);
        }
        let items = null;
        if (Array.isArray(body)) {
            items = body;
        }
        else if (body && typeof body === 'object') {
            const bodyRecord = body;
            if (Array.isArray(bodyRecord.items)) {
                items = bodyRecord.items;
            }
        }
        if (!items) {
            throw new common_1.BadRequestException('Veri formatı hatalı. Excel dosyası veya JSON listesi bekleniyor.');
        }
        return this.itemsService.importItems(items, userId);
    }
    async getImportTemplate() {
        return this.itemsService.getImportTemplate();
    }
    async exportItems(query) {
        return this.itemsService.exportToExcel(query);
    }
    getStatus() { return this.itemsService.getStatus(); }
    findAllItemTypes() { return this.itemsService.findAllItemTypes(); }
    findAllQuantityTypes() { return this.itemsService.findAllQuantityTypes(); }
    findAllCodeGroups() { return this.itemsService.findAllItemCodeGroups(); }
    findAll(query) { return this.itemsService.findAll(query); }
    findOne(id) { return this.itemsService.findOne(id); }
    create(dto, userId) { return this.itemsService.create(dto, userId); }
    createItemType(dto, userId) { return this.itemsService.createItemType(dto, userId); }
    createCodeGroup(dto, userId) {
        return this.itemsService.createItemCodeGroup(dto, userId);
    }
    createQuantityType(dto, userId) { return this.itemsService.createQuantityType(dto, userId); }
    updateQuantityType(id, dto, userId) {
        return this.itemsService.updateQuantityType(id, dto, userId);
    }
    removeQuantityType(id) { return this.itemsService.softDeleteQuantityType(id); }
    updateItemType(id, dto, userId) {
        return this.itemsService.updateItemType(id, dto, userId);
    }
    updateCodeGroup(id, dto, userId) {
        return this.itemsService.updateItemCodeGroup(id, dto, userId);
    }
    update(id, dto, user) {
        const isSystemAdmin = user.isSystemAdmin;
        const permissions = user.permissions || [];
        if (!isSystemAdmin) {
            if (dto.salePrice !== undefined && !permissions.includes('INVENTORY_EDIT_PRICE')) {
                throw new common_1.ForbiddenException('Satış fiyatlarını düzenlemek için yetkiniz bulunmamaktadır.');
            }
            if (dto.purchasePrice !== undefined && !permissions.includes('INVENTORY_EDIT_COST')) {
                throw new common_1.ForbiddenException('Alış/maliyet fiyatlarını düzenlemek için yetkiniz bulunmamaktadır.');
            }
            if (dto.criticalLimit !== undefined && !permissions.includes('INVENTORY_EDIT_STOCK_LIMIT')) {
                throw new common_1.ForbiddenException('Kritik stok limitlerini düzenlemek için yetkiniz bulunmamaktadır.');
            }
        }
        return this.itemsService.update(id, dto, String(user.sub));
    }
    removeItemType(id) { return this.itemsService.softDeleteItemType(id); }
    removeCodeGroup(id) { return this.itemsService.softDeleteItemCodeGroup(id); }
    remove(id, userId) {
        return this.itemsService.softDelete(id, userId);
    }
};
exports.ItemsController = ItemsController;
__decorate([
    (0, common_1.Post)('import'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_CREATE'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "importItems", null);
__decorate([
    (0, common_1.Get)('import-template'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "getImportTemplate", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.ItemsQueryDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "exportItems", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('types'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "findAllItemTypes", null);
__decorate([
    (0, common_1.Get)('quantity-types'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "findAllQuantityTypes", null);
__decorate([
    (0, common_1.Get)('code-groups'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "findAllCodeGroups", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.ItemsQueryDto]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateItemDto, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('types'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateItemTypeDto, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "createItemType", null);
__decorate([
    (0, common_1.Post)('code-groups'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateItemCodeGroupDto, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "createCodeGroup", null);
__decorate([
    (0, common_1.Post)('quantity-types'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateQuantityTypeDto, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "createQuantityType", null);
__decorate([
    (0, common_1.Put)('quantity-types/:id'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateQuantityTypeDto, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "updateQuantityType", null);
__decorate([
    (0, common_1.Delete)('quantity-types/:id'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "removeQuantityType", null);
__decorate([
    (0, common_1.Put)('types/:id'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateItemTypeDto, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "updateItemType", null);
__decorate([
    (0, common_1.Put)('code-groups/:id'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateItemCodeGroupDto, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "updateCodeGroup", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_EDIT', 'INVENTORY_EDIT_PRICE', 'INVENTORY_EDIT_COST', 'INVENTORY_EDIT_STOCK_LIMIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateItemDto, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('types/:id'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "removeItemType", null);
__decorate([
    (0, common_1.Delete)('code-groups/:id'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "removeCodeGroup", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('INVENTORY_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "remove", null);
exports.ItemsController = ItemsController = __decorate([
    (0, common_1.Controller)('items'),
    __metadata("design:paramtypes", [items_service_1.ItemsService])
], ItemsController);
//# sourceMappingURL=items.controller.js.map