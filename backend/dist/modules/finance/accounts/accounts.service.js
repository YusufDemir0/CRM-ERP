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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const commercial_account_entity_1 = require("./entities/commercial-account.entity");
let AccountsService = class AccountsService {
    constructor(accRepo) {
        this.accRepo = accRepo;
    }
    async findAll(query) {
        const qb = this.accRepo.createQueryBuilder('acc')
            .leftJoinAndSelect('acc.currency', 'currency');
        if (query.search) {
            qb.where('(acc.name LIKE :s OR acc.bankName LIKE :s)', { s: `%${query.search}%` });
        }
        qb.orderBy('acc.name', 'ASC').skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const acc = await this.accRepo.findOne({ where: { id }, relations: ['currency'] });
        if (!acc)
            throw new common_1.NotFoundException('Hesap bulunamadı');
        return acc;
    }
    async create(dto, userId) {
        const acc = this.accRepo.create({ ...dto, createdBy: userId });
        return this.accRepo.save(acc);
    }
    async update(id, dto, userId) {
        const acc = await this.findOne(id);
        Object.assign(acc, dto);
        acc.updatedBy = userId || null;
        return this.accRepo.save(acc);
    }
    async softDelete(id) {
        await this.findOne(id);
        await this.accRepo.softDelete(id);
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(commercial_account_entity_1.CommercialAccount)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map