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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const throttler_1 = require("@nestjs/throttler");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(dto, res, req) {
        const rawIp = req.ip || req.headers['x-forwarded-for'];
        const ipAddress = Array.isArray(rawIp) ? rawIp[0] : (rawIp || undefined);
        const { access_token, refresh_token, user } = await this.authService.login(dto, ipAddress);
        const isProd = process.env.NODE_ENV === 'production';
        const sameSiteMode = isProd ? 'none' : 'lax';
        res.cookie('erp_token', access_token, {
            httpOnly: true,
            secure: isProd,
            sameSite: sameSiteMode,
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('erp_refresh_token', refresh_token, {
            httpOnly: true,
            secure: isProd,
            sameSite: sameSiteMode,
            path: '/api/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            message: 'Giriş başarılı',
            user
        };
    }
    async refresh(req, res) {
        const oldRefreshToken = req.cookies['erp_refresh_token'];
        const { access_token, refresh_token } = await this.authService.refreshToken(oldRefreshToken);
        const isProd = process.env.NODE_ENV === 'production';
        const sameSiteMode = isProd ? 'none' : 'lax';
        res.cookie('erp_token', access_token, {
            httpOnly: true,
            secure: isProd,
            sameSite: sameSiteMode,
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('erp_refresh_token', refresh_token, {
            httpOnly: true,
            secure: isProd,
            sameSite: sameSiteMode,
            path: '/api/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { message: 'Token refreshed' };
    }
    async logout(req, res) {
        const token = req.cookies['erp_token'];
        if (token) {
            try {
                const payload = this.authService.decodeToken(token);
                if (payload && payload.sub) {
                    const rawIp = req.ip || req.headers['x-forwarded-for'];
                    const ipAddress = Array.isArray(rawIp) ? rawIp[0] : (rawIp || undefined);
                    await this.authService.logout(String(payload.sub), payload.username, payload.fullName || '', ipAddress);
                }
            }
            catch (e) {
            }
        }
        const isProd = process.env.NODE_ENV === 'production';
        const sameSiteMode = isProd ? 'none' : 'lax';
        res.clearCookie('erp_token', {
            httpOnly: true,
            secure: isProd,
            sameSite: sameSiteMode,
        });
        res.clearCookie('erp_refresh_token', {
            httpOnly: true,
            secure: isProd,
            sameSite: sameSiteMode,
            path: '/api/auth/refresh',
        });
        return { message: 'Çıkış başarılı' };
    }
    async register(dto) {
        await this.authService.register(dto);
        return { message: 'Kayıt başarılı' };
    }
    async getProfile(userId) {
        return this.authService.getProfile(userId);
    }
    async forgotPassword(dto) {
        return this.authService.forgotPassword(dto);
    }
    async changePassword(userId, dto) {
        return this.authService.changePassword(userId, dto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)('USERS_CREATE'),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 300000 } }),
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 300000 } }),
    (0, common_1.Post)('change-password'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map