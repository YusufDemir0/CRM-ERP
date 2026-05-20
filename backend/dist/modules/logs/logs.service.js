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
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const log_entity_1 = require("./entities/log.entity");
const sql_helper_1 = require("../../common/utils/sql.helper");
const config_1 = require("@nestjs/config");
let LogsService = class LogsService {
    constructor(logRepository, configService) {
        this.logRepository = logRepository;
        this.configService = configService;
        this.logger = new common_1.Logger('SystemAudit');
        this.dbLoggingEnabled = this.configService.get('DB_LOGGING_ENABLED', false);
    }
    onModuleInit() {
        this.logger.log(`LogsService initialized. DB Logging: ${this.dbLoggingEnabled}`);
    }
    async findAll(query) {
        const qb = this.logRepository.createQueryBuilder('log');
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.where('(log.username LIKE :s OR log.fullName LIKE :s OR log.action LIKE :s OR log.module LIKE :s OR log.details LIKE :s)', { s });
        }
        if (query.module) {
            qb.andWhere('log.module = :module', { module: query.module });
        }
        const allowedSortCols = ['createdAt', 'tag', 'username', 'action', 'module'];
        const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy : 'createdAt';
        qb.orderBy(`log.${sortCol}`, query.sortOrder?.toUpperCase() || 'DESC');
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                total,
                page: query.page || 1,
                limit: query.limit || 20,
                totalPages: Math.ceil(total / (query.limit || 20))
            }
        };
    }
    logActivity(data) {
        const logPayload = {
            timestamp: new Date().toISOString(),
            ...data,
        };
        this.logger.log(JSON.stringify(logPayload));
    }
    async addLog(data) {
        this.logActivity(data);
        if (this.dbLoggingEnabled) {
            try {
                const entity = this.logRepository.create(data);
                return await this.logRepository.save(entity);
            }
            catch (err) {
                this.logger.error(`Failed to save log to DB: ${err.message}`);
            }
        }
        return null;
    }
    async getNotifications(limit = 20) {
        return this.logRepository.find({
            select: ['id', 'action', 'module', 'tag', 'details', 'createdAt'],
            where: { isDeleted: false },
            order: { createdAt: 'DESC' },
            take: limit
        });
    }
    async markAsRead(id) {
        await this.logRepository.update(id, { isDeleted: true });
    }
    async markAllAsRead() {
        await this.logRepository.update({ isDeleted: false }, { isDeleted: true });
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(log_entity_1.SystemLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], LogsService);
//# sourceMappingURL=logs.service.js.map