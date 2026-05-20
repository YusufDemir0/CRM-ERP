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
var AuthService_1;
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
const record_state_enum_1 = require("../../common/enums/record-state.enum");
let AuthService = AuthService_1 = class AuthService {
    constructor(userRepo, userRoleRepo, rolePermRepo, userPermRepo, jwtService) {
        this.userRepo = userRepo;
        this.userRoleRepo = userRoleRepo;
        this.rolePermRepo = rolePermRepo;
        this.userPermRepo = userPermRepo;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    onModuleInit() {
    }
    async login(dto) {
        const user = await this.userRepo.findOne({
            where: { username: dto.username },
            relations: ['roles'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Kullanıcı adı veya şifre hatalı');
        }
        if (user.state === 2) {
            throw new common_1.UnauthorizedException('Hesabınız kalıcı olarak kilitlenmiştir. Lütfen sistem yöneticisi ile iletişime geçiniz.');
        }
        if (user.lockedUntil && new Date() < user.lockedUntil) {
            const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - new Date().getTime()) / 60000);
            throw new common_1.UnauthorizedException(`Çok fazla hatalı deneme. Hesabınız ${remainingMinutes} dakika daha kilitli kalacaktır.`);
        }
        if (user.state !== 1) {
            throw new common_1.UnauthorizedException('Hesabınız devre dışı bırakılmıştır');
        }
        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            const failedAttempts = (user.failedLoginAttempts || 0) + 1;
            const updates = { id: user.id, failedLoginAttempts: failedAttempts };
            if (failedAttempts >= 5) {
                const lockDuration = 15 * 60 * 1000;
                updates.lockedUntil = new Date(Date.now() + lockDuration);
                updates.failedLoginAttempts = 0;
            }
            await this.userRepo.update(user.id, updates);
            throw new common_1.UnauthorizedException('Kullanıcı adı veya şifre hatalı');
        }
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
            await this.userRepo.update(user.id, {
                id: user.id,
                failedLoginAttempts: 0,
                lockedUntil: null
            });
        }
        const payload = {
            sub: user.id,
            username: user.username,
            departmentId: user.departmentId,
            tokenVersion: user.tokenVersion,
        };
        const userProfile = await this.getProfile(String(user.id));
        const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refresh_token = this.jwtService.sign({ sub: user.id, type: 'refresh', tokenVersion: user.tokenVersion }, { expiresIn: '7d' });
        const refreshSalt = await bcrypt.genSalt(10);
        user.refreshTokenHash = await bcrypt.hash(refresh_token, refreshSalt);
        await this.userRepo.save(user);
        return {
            access_token,
            refresh_token,
            user: userProfile,
        };
    }
    async refreshToken(oldRefreshToken) {
        if (!oldRefreshToken)
            throw new common_1.UnauthorizedException('Refresh token is missing');
        try {
            const payload = this.jwtService.verify(oldRefreshToken, { ignoreExpiration: false });
            if (payload.type !== 'refresh') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            const user = await this.userRepo.findOne({ where: { id: payload.sub } });
            if (!user || user.state !== 1) {
                throw new common_1.UnauthorizedException('User not found or disabled');
            }
            if (user.tokenVersion !== payload.tokenVersion) {
                throw new common_1.UnauthorizedException('Token version mismatch');
            }
            const isMatch = await bcrypt.compare(oldRefreshToken, user.refreshTokenHash || '');
            if (!isMatch) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const newPayload = {
                sub: user.id,
                username: user.username,
                departmentId: user.departmentId,
                tokenVersion: user.tokenVersion,
            };
            const access_token = this.jwtService.sign(newPayload, { expiresIn: '15m' });
            const refresh_token = this.jwtService.sign({ sub: user.id, type: 'refresh', tokenVersion: user.tokenVersion }, { expiresIn: '7d' });
            const salt = await bcrypt.genSalt(10);
            user.refreshTokenHash = await bcrypt.hash(refresh_token, salt);
            await this.userRepo.save(user);
            return { access_token, refresh_token };
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async register(dto) {
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
        try {
            const savedUser = await this.userRepo.save(user);
            return {
                id: savedUser.id,
                username: savedUser.username,
                fullName: savedUser.fullName,
                email: savedUser.email,
            };
        }
        catch (error) {
            if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
                throw new common_1.ConflictException('Bu kullanıcı adı veya email zaten kullanılıyor');
            }
            throw error;
        }
    }
    async getProfile(userId) {
        const user = await this.userRepo.createQueryBuilder('user')
            .leftJoinAndSelect('user.department', 'department')
            .leftJoinAndSelect('user.roles', 'role')
            .leftJoinAndSelect('role.permissions', 'permission')
            .leftJoinAndSelect('user.userPermissions', 'userPerm')
            .leftJoinAndSelect('userPerm.permission', 'userPermData')
            .select([
            'user.id',
            'user.username',
            'user.fullName',
            'user.email',
            'user.phone',
            'user.departmentId',
            'user.state',
            'department.id',
            'department.name',
            'role.id',
            'role.name',
            'permission.id',
            'permission.key',
            'permission.name',
            'permission.module',
            'userPerm.userId',
            'userPerm.scopeType',
            'userPerm.effect',
            'userPerm.permissionId',
            'userPermData.id',
            'userPermData.key',
            'userPermData.name'
        ])
            .where('user.id = :userId', { userId })
            .getOne();
        if (!user)
            throw new common_1.UnauthorizedException('Kullanıcı bulunamadı');
        const rolePermissions = user.roles?.flatMap(r => r.permissions?.map(p => p.key) || []) || [];
        const userAllowKeys = user.userPermissions?.filter(up => up.effect === 'allow').map(up => up.permission?.key) || [];
        const userDenyKeys = user.userPermissions?.filter(up => up.effect === 'deny').map(up => up.permission?.key) || [];
        const finalPermissions = Array.from(new Set([...rolePermissions, ...userAllowKeys]))
            .filter(key => key && !userDenyKeys.includes(key));
        return {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            departmentId: user.departmentId,
            department: user.department,
            roles: user.roles?.map(r => ({ id: r.id, name: r.name })) || [],
            permissions: finalPermissions
        };
    }
    async forgotPassword(dto) {
        const user = await this.userRepo.findOne({ where: { email: dto.email, state: record_state_enum_1.RecordState.ACTIVE } });
        if (!user) {
            throw new common_1.NotImplementedException('E-posta altyapısı (SMTP) henüz kurulmadığı için şifre sıfırlama işlemi yapılamıyor. Lütfen sistem yöneticinizle iletişime geçin.');
        }
        this.logger.warn(`Password reset requested for ${dto.email} — email delivery not configured`);
        throw new common_1.NotImplementedException('E-posta altyapısı (SMTP) henüz kurulmadığı için şifre sıfırlama işlemi yapılamıyor. Lütfen sistem yöneticinizle iletişime geçin.');
    }
    async changePassword(userId, dto) {
        const user = await this.userRepo.findOne({ where: { id: String(userId) } });
        if (!user)
            throw new common_1.UnauthorizedException('Kullanıcı bulunamadı');
        const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isMatch)
            throw new common_1.UnauthorizedException('Mevcut şifre hatalı');
        const salt = await bcrypt.genSalt(12);
        user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
        user.tokenVersion += 1;
        await this.userRepo.save(user);
        return { message: 'Şifre başarıyla değiştirildi. Lütfen yeni şifrenizle giriş yapınız.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
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