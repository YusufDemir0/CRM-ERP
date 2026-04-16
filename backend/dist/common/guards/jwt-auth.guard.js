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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../modules/auth/entities/user.entity");
const public_decorator_1 = require("../decorators/public.decorator");
const cache_manager_1 = require("@nestjs/cache-manager");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    constructor(reflector, cacheManager, userRepo) {
        super();
        this.reflector = reflector;
        this.cacheManager = cacheManager;
        this.userRepo = userRepo;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const activated = await super.canActivate(context);
        if (!activated) {
            return false;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user && user.sub) {
            const cacheKey = `user_version_${user.sub}`;
            let dbVersion = await this.cacheManager.get(cacheKey);
            if (dbVersion === undefined || dbVersion === null) {
                const dbUser = await this.userRepo.findOne({ where: { id: user.sub }, select: ['tokenVersion'] });
                dbVersion = dbUser?.tokenVersion || 0;
                await this.cacheManager.set(cacheKey, dbVersion, 300000);
            }
            if (user.tokenVersion !== dbVersion) {
                throw new common_1.UnauthorizedException('Oturumunuz sonlandırılmış. Lütfen tekrar giriş yapın.');
            }
        }
        return true;
    }
    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new common_1.UnauthorizedException('Geçersiz veya eksik token');
        }
        return user;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [core_1.Reflector, Object, typeorm_2.Repository])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map