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
var JwtStrategy_1;
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
const common_2 = require("@nestjs/common");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService, dataSource, cacheManager) {
        super({
            jwtFromRequest: (req) => {
                if (req && req.cookies) {
                    return req.cookies['erp_token'] ?? null;
                }
                return null;
            },
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret'),
        });
        this.dataSource = dataSource;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(JwtStrategy_1.name);
    }
    async validate(payload) {
        const cacheKey = `user_state_${payload.sub}`;
        let state = await this.cacheManager.get(cacheKey);
        if (state === undefined || state === null) {
            const user = await this.dataSource.getRepository(user_entity_1.User).findOne({
                where: { id: payload.sub },
                select: ['id', 'state']
            });
            if (!user) {
                throw new common_1.UnauthorizedException('Kullanıcı bulunamadı veya silinmiş');
            }
            state = user.state;
            await this.cacheManager.set(cacheKey, state, 300000);
        }
        if (state !== record_state_enum_1.RecordState.ACTIVE) {
            throw new common_1.UnauthorizedException('Kullanıcı hesabı askıya alınmış veya pasif durumda');
        }
        return {
            id: payload.sub,
            sub: payload.sub,
            username: payload.username,
            departmentId: payload.departmentId,
            tokenVersion: payload.tokenVersion,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_1.DataSource, Object])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map