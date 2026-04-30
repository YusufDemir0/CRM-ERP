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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const config_1 = require("@nestjs/config");
let CacheService = CacheService_1 = class CacheService {
    constructor(cacheManager, configService) {
        this.cacheManager = cacheManager;
        this.configService = configService;
        this.logger = new common_1.Logger(CacheService_1.name);
        this.keyPrefix = this.configService.get('redis.keyPrefix') || 'ermay:';
    }
    prefixKey(key) {
        return `${this.keyPrefix}${key}`;
    }
    async get(key) {
        try {
            return await this.cacheManager.get(this.prefixKey(key));
        }
        catch (error) {
            this.logger.warn(`Cache GET failed for key "${key}": ${error.message}`);
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            await this.cacheManager.set(this.prefixKey(key), value, ttl);
        }
        catch (error) {
            this.logger.warn(`Cache SET failed for key "${key}": ${error.message}`);
        }
    }
    async del(key) {
        try {
            await this.cacheManager.del(this.prefixKey(key));
        }
        catch (error) {
            this.logger.warn(`Cache DEL failed for key "${key}": ${error.message}`);
        }
    }
    async reset() {
        try {
            await this.cacheManager.clear();
        }
        catch (error) {
            this.logger.warn(`Cache RESET failed: ${error.message}`);
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map