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
exports.DepartmentsController = void 0;
const common_1 = require("@nestjs/common");
const departments_service_1 = require("./departments.service");
const department_dto_1 = require("./dto/department.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let DepartmentsController = class DepartmentsController {
    constructor(deptService) {
        this.deptService = deptService;
    }
    findAll(query, user) {
        return this.deptService.findAll(query, user);
    }
    getStatus() { return this.deptService.getStatus(); }
    findAllTypes() { return this.deptService.findAllTypes(); }
    createType(dto, userId) {
        return this.deptService.createType(dto, userId);
    }
    updateType(id, dto, userId) {
        return this.deptService.updateType(id, dto, userId);
    }
    removeType(id) {
        return this.deptService.softDeleteType(id);
    }
    findOne(id) { return this.deptService.findOne(id); }
    create(dto, userId) { return this.deptService.create(dto, userId); }
    update(id, dto, userId) {
        return this.deptService.update(id, dto, userId);
    }
    remove(id) { return this.deptService.softDelete(id); }
};
exports.DepartmentsController = DepartmentsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_VIEW_ALL', 'DEPARTMENTS_PAGE', 'SALES_PAGE', 'FINANCE_PAGE', 'INVENTORY_PAGE', 'USERS_PAGE'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [department_dto_1.DepartmentsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_VIEW_ALL', 'DEPARTMENTS_PAGE'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('types'),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_VIEW_ALL', 'DEPARTMENTS_PAGE', 'USERS_PAGE', 'SYSTEM_PAGE'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "findAllTypes", null);
__decorate([
    (0, common_1.Post)('types'),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [department_dto_1.CreateDepartmentTypeDto, String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "createType", null);
__decorate([
    (0, common_1.Put)('types/:id'),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, department_dto_1.UpdateDepartmentTypeDto, String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "updateType", null);
__decorate([
    (0, common_1.Delete)('types/:id'),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "removeType", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_VIEW_ALL', 'DEPARTMENTS_PAGE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [department_dto_1.CreateDepartmentDto, String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, department_dto_1.UpdateDepartmentDto, String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('DEPARTMENTS_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "remove", null);
exports.DepartmentsController = DepartmentsController = __decorate([
    (0, common_1.Controller)('departments'),
    __metadata("design:paramtypes", [departments_service_1.DepartmentsService])
], DepartmentsController);
//# sourceMappingURL=departments.controller.js.map