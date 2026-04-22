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
var LogsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const log_entity_1 = require("./entities/log.entity");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const sql_helper_1 = require("../../common/utils/sql.helper");
let LogsService = LogsService_1 = class LogsService {
    constructor(logRepository) {
        this.logRepository = logRepository;
        this.logger = new common_1.Logger(LogsService_1.name);
        this.logSubject = new rxjs_1.Subject();
    }
    onModuleInit() {
        this.logger.log('LogsService initialized (Batch Logger enabled).');
        this.logSubscription = this.logSubject.pipe((0, operators_1.bufferTime)(5000, undefined, 1000), (0, operators_1.filter)(logs => logs.length > 0)).subscribe(async (logs) => {
            try {
                const entities = this.logRepository.create(logs);
                await this.logRepository.save(entities);
            }
            catch (err) {
                this.logger.error(`Failed to save batched logs: ${err.message}`);
            }
        });
    }
    onModuleDestroy() {
        if (this.logSubscription) {
            this.logSubscription.unsubscribe();
        }
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
        qb.orderBy(`log.${sortCol}`, query.sortOrder || 'DESC');
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
        this.logSubject.next(data);
    }
    async addLog(data) {
        const log = this.logRepository.create(data);
        return this.logRepository.save(log);
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = LogsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(log_entity_1.SystemLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LogsService);
//# sourceMappingURL=logs.service.js.map