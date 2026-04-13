"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./entities/user.entity");
const user_role_entity_1 = require("./entities/user-role.entity");
const role_permission_entity_1 = require("./entities/role-permission.entity");
const user_permission_entity_1 = require("./entities/user-permission.entity");
let AuthService = class AuthService {
    constructor(userRepo, userRoleRepo, rolePermRepo, userPermRepo, jwtService) {
        this.userRepo = userRepo;
        this.userRoleRepo = userRoleRepo;
        this.rolePermRepo = rolePermRepo;
        this.userPermRepo = userPermRepo;
        this.jwtService = jwtService;
    }
    async login(dto) {
        const user = await this.userRepo.findOne({
            where: { username: dto.username },
            relations: ['roles'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('INVALID_USERNAME');
        }
        if (user.state === 2) {
            throw new common_1.UnauthorizedException('Hesabınız kilitlenmiştir. Lütfen sistem yöneticisi ile iletişime geçiniz.');
        }
        if (user.state !== 1) {
            throw new common_1.UnauthorizedException('Hesabınız devre dışı bırakılmıştır');
        }
        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= 3) {
                user.state = 2;
            }
            await this.userRepo.save(user);
            throw new common_1.UnauthorizedException('INVALID_PASSWORD');
        }
        if (user.failedLoginAttempts > 0) {
            user.failedLoginAttempts = 0;
            await this.userRepo.save(user);
        }
        const payload = {
            sub: user.id,
            username: user.username,
            departmentId: user.departmentId,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                departmentId: user.departmentId,
                roles: user.roles?.map((r) => r.name) || [],
            },
        };
    }
    async register(dto) {
        const existingUser = await this.userRepo.findOne({
            where: [{ username: dto.username }, { email: dto.email }],
        });
        if (existingUser) {
            throw new common_1.ConflictException('Bu kullanıcı adı veya email zaten kullanılıyor');
        }
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(dto.password, salt);
        const user = this.userRepo.create({
            username: dto.username,
            passwordHash,
            fullName: dto.fullName,
            email: dto.email,
            phone: dto.phone || null,
            departmentId: dto.departmentId || null,
        });
        const savedUser = await this.userRepo.save(user);
        return {
            id: savedUser.id,
            username: savedUser.username,
            fullName: savedUser.fullName,
            email: savedUser.email,
        };
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['roles', 'department'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Kullanıcı bulunamadı');
        }
        const userRoles = await this.userRoleRepo.find({ where: { userId }, relations: ['role'] });
        const roleIds = userRoles.map(ur => ur.roleId);
        let permissions = [];
        if (roleIds.length > 0) {
            const rolePerms = await this.rolePermRepo.find({
                where: { roleId: (0, typeorm_2.In)(roleIds) },
                relations: ['permission']
            });
            permissions = rolePerms.map(rp => rp.permission?.key).filter(Boolean);
        }
        const userPerms = await this.userPermRepo.find({ where: { userId }, relations: ['permission'] });
        const userAllowKeys = userPerms.filter(up => up.effect === 'allow').map(up => up.permission?.key);
        const userDenyKeys = userPerms.filter(up => up.effect === 'deny').map(up => up.permission?.key);
        const finalPermissions = Array.from(new Set([...permissions, ...userAllowKeys])).filter(key => !userDenyKeys.includes(key));
        return {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            departmentId: user.departmentId,
            department: user.department,
            roles: user.roles?.map((r) => ({ id: r.id, name: r.name })) || [],
            permissions: finalPermissions
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(2, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(3, (0, typeorm_1.InjectRepository)(user_permission_entity_1.UserPermission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map