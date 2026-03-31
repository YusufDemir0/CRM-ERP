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
exports.PartiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const party_entity_1 = require("./entities/party.entity");
let PartiesService = class PartiesService {
    constructor(partyRepo) {
        this.partyRepo = partyRepo;
    }
    async findAll(query) {
        const qb = this.partyRepo.createQueryBuilder('party')
            .leftJoinAndSelect('party.currency', 'currency');
        if (query.search) {
            qb.where('(party.name LIKE :s OR party.phone1 LIKE :s OR party.email LIKE :s OR party.taxNumber LIKE :s)', { s: `%${query.search}%` });
        }
        if (query.type) {
            qb.andWhere('party.type = :type', { type: query.type });
        }
        qb.orderBy(`party.${query.sortBy || 'name'}`, query.sortOrder || 'ASC');
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const party = await this.partyRepo.findOne({ where: { id }, relations: ['currency'] });
        if (!party)
            throw new common_1.NotFoundException('Cari hesap bulunamadı');
        return party;
    }
    async create(dto, userId) {
        const party = this.partyRepo.create({ ...dto, createdBy: userId });
        return this.partyRepo.save(party);
    }
    async update(id, dto, userId) {
        const party = await this.findOne(id);
        Object.assign(party, dto);
        party.updatedBy = userId || null;
        return this.partyRepo.save(party);
    }
    async softDelete(id) {
        await this.findOne(id);
        await this.partyRepo.softDelete(id);
    }
    async getBalance(id) {
        const party = await this.findOne(id);
        return {
            balance: Number(party.balance),
            creditLimit: Number(party.creditLimit),
            available: Number(party.creditLimit) - Number(party.balance),
        };
    }
};
exports.PartiesService = PartiesService;
exports.PartiesService = PartiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(party_entity_1.Party)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PartiesService);
//# sourceMappingURL=parties.service.js.map