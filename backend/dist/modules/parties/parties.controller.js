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
exports.PartiesController = void 0;
const common_1 = require("@nestjs/common");
const parties_service_1 = require("./parties.service");
const party_dto_1 = require("./dto/party.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const party_dto_2 = require("./dto/party.dto");
let PartiesController = class PartiesController {
    constructor(partiesService) {
        this.partiesService = partiesService;
    }
    findAll(query, user) {
        return this.partiesService.findAll(query, user);
    }
    getStatus() { return this.partiesService.getStatus(); }
    findAllMovements(query, user) {
        return this.partiesService.findAllMovements(query, user);
    }
    lookup(type, user) {
        return this.partiesService.lookup(type, user);
    }
    findOne(id) { return this.partiesService.findOne(id); }
    getBalance(id) { return this.partiesService.getBalance(id); }
    getStatement(id) { return this.partiesService.getStatement(id); }
    create(dto, userId) { return this.partiesService.create(dto, userId); }
    update(id, dto, user) {
        return this.partiesService.update(id, dto, String(user.sub), user);
    }
    remove(id) { return this.partiesService.softDelete(id); }
};
exports.PartiesController = PartiesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [party_dto_1.PartiesQueryDto, Object]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('all-movements'),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [party_dto_2.MovementsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "findAllMovements", null);
__decorate([
    (0, common_1.Get)('lookup'),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_USE_SELECTION', 'PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL', 'SALES_CREATE', 'SALES_EDIT_OWN', 'SALES_EDIT_ALL', 'SALES_VIEW_OWN', 'SALES_VIEW_DEPT', 'SALES_VIEW_ALL'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "lookup", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/balance'),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)(':id/statement'),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL', 'PARTIES_VIEW_SALES_HISTORY'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "getStatement", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [party_dto_1.CreatePartyDto, String]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_EDIT_OWN', 'PARTIES_EDIT_ALL'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, party_dto_1.UpdatePartyDto, Object]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('PARTIES_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PartiesController.prototype, "remove", null);
exports.PartiesController = PartiesController = __decorate([
    (0, common_1.Controller)('parties'),
    __metadata("design:paramtypes", [parties_service_1.PartiesService])
], PartiesController);
//# sourceMappingURL=parties.controller.js.map