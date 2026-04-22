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
exports.CurrenciesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const currency_entity_1 = require("./entities/currency.entity");
let CurrenciesService = class CurrenciesService {
    constructor(currencyRepo) {
        this.currencyRepo = currencyRepo;
    }
    async findAll(query) {
        const qb = this.currencyRepo.createQueryBuilder('currency');
        const allowedSortCols = ['code', 'name', 'symbol', 'exchangeRate', 'isDefault', 'createdAt'];
        const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy : 'isDefault';
        const sortOrder = query.sortBy ? (query.sortOrder || 'ASC') : 'DESC';
        qb.orderBy(`currency.${sortCol}`, sortOrder);
        if (query.skip !== undefined)
            qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const curr = await this.currencyRepo.findOne({ where: { id } });
        if (!curr)
            throw new common_1.NotFoundException('Para birimi bulunamadı');
        return curr;
    }
    async create(dto, userId) {
        const curr = this.currencyRepo.create({ ...dto, createdBy: userId });
        return this.currencyRepo.save(curr);
    }
    async update(id, dto, userId) {
        const curr = await this.findOne(id);
        if (dto.name !== undefined)
            curr.name = dto.name;
        if (dto.symbol !== undefined)
            curr.symbol = dto.symbol;
        if (dto.exchangeRate !== undefined)
            curr.exchangeRate = dto.exchangeRate;
        if (dto.isDefault !== undefined)
            curr.isDefault = dto.isDefault;
        if (dto.state !== undefined)
            curr.state = dto.state;
        curr.updatedBy = userId || null;
        return this.currencyRepo.save(curr);
    }
    async getDefault() {
        const curr = await this.currencyRepo.findOne({ where: { isDefault: 1 } });
        if (!curr)
            throw new common_1.NotFoundException('Varsayılan para birimi tanımlı değil');
        return curr;
    }
    async setDefault(id) {
        await this.currencyRepo
            .createQueryBuilder()
            .update(currency_entity_1.Currency)
            .set({ isDefault: 0 })
            .execute();
        const curr = await this.findOne(id);
        curr.isDefault = 1;
        return this.currencyRepo.save(curr);
    }
    async delete(id) {
        const curr = await this.findOne(id);
        if (curr.isDefault) {
            throw new common_1.BadRequestException('Varsayılan para birimi silinemez');
        }
        await this.currencyRepo.softDelete(id);
    }
};
exports.CurrenciesService = CurrenciesService;
exports.CurrenciesService = CurrenciesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(currency_entity_1.Currency)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CurrenciesService);
//# sourceMappingURL=currencies.service.js.map