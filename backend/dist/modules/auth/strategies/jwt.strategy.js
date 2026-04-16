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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const record_state_enum_1 = require("../../../common/enums/record-state.enum");
const cache_manager_1 = require("@nestjs/cache-manager");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService, dataSource, cacheManager) {
        super({
            jwtFromRequest: (req) => {
                if (req && req.cookies) {
                    return req.cookies['erp_token'] ?? null;
                }
                return null;
            },
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret') || 'erp-super-secret-key',
        });
        this.dataSource = dataSource;
        this.cacheManager = cacheManager;
    }
    async validate(payload) {
        const cacheKey = `user_state_${payload.sub}`;
        let userState = await this.cacheManager.get(cacheKey);
        if (!userState) {
            const user = await this.dataSource.getRepository(user_entity_1.User).findOne({
                where: { id: payload.sub },
                select: ['id', 'state', 'tokenVersion']
            });
            if (!user) {
                throw new common_1.UnauthorizedException('Kullanıcı bulunamadı.');
            }
            userState = { state: user.state, tokenVersion: user.tokenVersion };
            await this.cacheManager.set(cacheKey, userState, 60000);
        }
        if (userState.state !== record_state_enum_1.RecordState.ACTIVE) {
            await this.cacheManager.del(cacheKey);
            throw new common_1.UnauthorizedException('Kullanıcı hesabı pasif.');
        }
        if (userState.tokenVersion !== payload.tokenVersion) {
            await this.cacheManager.del(cacheKey);
            throw new common_1.UnauthorizedException('Oturum sonlandırılmış veya geçersiz.');
        }
        return {
            id: payload.sub,
            sub: payload.sub,
            username: payload.username,
            departmentId: payload.departmentId,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_1.DataSource, Object])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map