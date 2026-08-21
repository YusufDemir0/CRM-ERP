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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const user_dto_1 = require("./dto/user.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll(query, user) {
        return this.usersService.findAll(query, user);
    }
    getStatus() {
        return this.usersService.getStatus();
    }
    findOne(id, user) {
        return this.usersService.findOne(id, user);
    }
    create(dto, userId) {
        return this.usersService.create(dto, userId);
    }
    update(id, dto, user) {
        const isSystemAdmin = user.isSystemAdmin;
        const permissions = user.permissions || [];
        if (!isSystemAdmin) {
            if (dto.password !== undefined && !permissions.includes('USERS_RESET_PASSWORD')) {
                throw new common_1.ForbiddenException('Kullanıcı şifre sıfırlama işlemi için yetkiniz bulunmamaktadır.');
            }
            if (dto.departmentId !== undefined && !permissions.includes('USERS_CHANGE_DEPARTMENT')) {
                throw new common_1.ForbiddenException('Kullanıcı departman değiştirme işlemi için yetkiniz bulunmamaktadır.');
            }
            if (dto.state !== undefined && !permissions.includes('USERS_LOCK_ACCOUNT')) {
                throw new common_1.ForbiddenException('Kullanıcı hesabı kilitleme/engelleme işlemi için yetkiniz bulunmamaktadır.');
            }
        }
        return this.usersService.update(id, dto, String(user.sub));
    }
    remove(id, userId) {
        return this.usersService.softDelete(id, userId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('USERS_VIEW_DEPT', 'USERS_VIEW_ALL'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.RequirePermissions)('USERS_VIEW_DEPT', 'USERS_VIEW_ALL'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('USERS_VIEW_DEPT', 'USERS_VIEW_ALL'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('USERS_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('USERS_EDIT', 'USERS_RESET_PASSWORD', 'USERS_CHANGE_DEPARTMENT', 'USERS_LOCK_ACCOUNT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('USERS_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map