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
const currencies_service_1 = require("../finance/currencies/currencies.service");
const decimal_js_1 = require("decimal.js");
let PartiesService = class PartiesService {
    constructor(partyRepo, currenciesService) {
        this.partyRepo = partyRepo;
        this.currenciesService = currenciesService;
    }
    async findAll(query) {
        const qb = this.partyRepo.createQueryBuilder('party')
            .leftJoinAndSelect('party.currency', 'currency');
        if (query.search) {
            qb.andWhere('(party.name LIKE :s OR party.phone1 LIKE :s OR party.email LIKE :s OR party.taxNumber LIKE :s OR party.taxOffice LIKE :s OR party.districtName LIKE :s OR party.address LIKE :s OR party.notes LIKE :s OR currency.name LIKE :s)', { s: `%${query.search}%` });
        }
        Object.keys(query).forEach(key => {
            const skipKeys = ['page', 'limit', 'search', 'sortBy', 'sortOrder', 'skip', 'type', 'state'];
            const allowedPartyKeys = ['name', 'phone1', 'email', 'taxNumber', 'taxOffice', 'cityId', 'districtName', 'type'];
            if (!skipKeys.includes(key) && allowedPartyKeys.includes(key) && query[key] !== undefined) {
                qb.andWhere(`party.${key} LIKE :${key}`, { [key]: `%${query[key]}%` });
            }
        });
        if (query.type) {
            qb.andWhere('party.type = :type', { type: query.type });
        }
        if (query.state !== undefined) {
            qb.andWhere('party.state = :state', { state: query.state });
        }
        const allowedSortCols = ['name', 'balance', 'creditLimit', 'createdAt'];
        const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy : 'name';
        qb.orderBy(`party.${sortCol}`, query.sortOrder || 'ASC');
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
        if (dto.taxNumber) {
            const existing = await this.partyRepo.findOne({
                where: { taxNumber: dto.taxNumber },
                withDeleted: true
            });
            if (existing) {
                throw new common_1.BadRequestException(`'${dto.taxNumber}' vergi numarası ile başka bir cari mevcut (ID: ${existing.id}, İsim: ${existing.name}).`);
            }
        }
        if (!dto.currencyId) {
            try {
                const defaultCurrency = await this.currenciesService.getDefault();
                dto.currencyId = Number(defaultCurrency.id);
            }
            catch (error) {
                console.warn('Default currency not found, setting to null');
            }
        }
        const party = this.partyRepo.create({ ...dto, createdBy: userId });
        return this.partyRepo.save(party);
    }
    async update(id, dto, userId) {
        const party = await this.findOne(id);
        if (dto.taxNumber && dto.taxNumber !== party.taxNumber) {
            const existing = await this.partyRepo.findOne({ where: { taxNumber: dto.taxNumber } });
            if (existing && existing.id !== id) {
                throw new common_1.BadRequestException(`'${dto.taxNumber}' vergi numarası ile başka bir cari mevcut (${existing.name}).`);
            }
        }
        const fields = [
            'name', 'type', 'phone1', 'phone2', 'taxOffice', 'taxNumber', 'email',
            'address', 'cityId', 'districtName', 'paymentTerms', 'currencyId', 'notes', 'state'
        ];
        fields.forEach((field) => {
            const dtoValue = dto[field];
            if (dtoValue !== undefined) {
                if (field === 'state' && dtoValue === 0 && !new decimal_js_1.Decimal(party.balance).isZero()) {
                    throw new common_1.BadRequestException(`Bakiyesi olan cari hesaplar pasife alınamaz. Mevcut Bakiye: ${party.balance.toString()}. ` +
                        `Lütfen önce finansal hesabı sıfırlayınız.`);
                }
                party[field] = dtoValue;
            }
        });
        if (dto.creditLimit !== undefined) {
            party.creditLimit = new decimal_js_1.Decimal(dto.creditLimit);
        }
        party.updatedBy = userId || null;
        return this.partyRepo.save(party);
    }
    async softDelete(id) {
        const party = await this.findOne(id);
        if (!new decimal_js_1.Decimal(party.balance).isZero()) {
            throw new common_1.BadRequestException(`Bakiyesi olan cari hesaplar silinemez. Mevcut Bakiye: ${party.balance.toString()}. ` +
                `Lütfen önce finansal hesabı sıfırlayınız (Tahsilat/Ödeme).`);
        }
        await this.partyRepo.softDelete(id);
    }
    async getBalance(id) {
        const party = await this.findOne(id);
        return {
            balance: Number(party.balance || 0),
            creditLimit: Number(party.creditLimit || 0),
            currency: party.currency?.code || 'TRY',
            symbol: party.currency?.symbol || '₺'
        };
    }
    async getStatus() {
        const [active, passive, all] = await Promise.all([
            this.partyRepo.count({ where: { state: 1 } }),
            this.partyRepo.count({ where: { state: 0 } }),
            this.partyRepo.find({ relations: ['currency'] }),
        ]);
        const totalReceivable = all.reduce((sum, p) => {
            const exchangeRate = new decimal_js_1.Decimal(p.currency?.exchangeRate || 1);
            return sum.plus(new decimal_js_1.Decimal(p.balance || 0).mul(exchangeRate));
        }, new decimal_js_1.Decimal(0));
        const totalCreditLimit = all.reduce((sum, p) => {
            const exchangeRate = new decimal_js_1.Decimal(p.currency?.exchangeRate || 1);
            return sum.plus(new decimal_js_1.Decimal(p.creditLimit || 0).mul(exchangeRate));
        }, new decimal_js_1.Decimal(0));
        const atRisk = all.filter(p => {
            const exchangeRate = new decimal_js_1.Decimal(p.currency?.exchangeRate || 1);
            const tlBalance = new decimal_js_1.Decimal(p.balance || 0).mul(exchangeRate);
            const tlLimit = new decimal_js_1.Decimal(p.creditLimit || 0).mul(exchangeRate);
            return p.state === 1 && tlLimit.gt(0) && tlBalance.abs().gte(tlLimit.mul(0.9));
        });
        return {
            active,
            passive,
            totalReceivable: totalReceivable.toNumber(),
            exposurePercentage: totalCreditLimit.gt(0) ? totalReceivable.div(totalCreditLimit).mul(100).toDecimalPlaces(0).toNumber() : 0,
            atRiskCount: atRisk.length
        };
    }
    async getGlobalExposure() {
        const all = await this.partyRepo.find({ relations: ['currency'] });
        const totalReceivable = all.reduce((sum, p) => {
            const exchangeRate = p.currency?.exchangeRate || new decimal_js_1.Decimal(1);
            return sum.plus(new decimal_js_1.Decimal(p.balance || 0).mul(exchangeRate));
        }, new decimal_js_1.Decimal(0));
        const totalCreditLimit = all.reduce((sum, p) => {
            const exchangeRate = p.currency?.exchangeRate || new decimal_js_1.Decimal(1);
            return sum.plus(new decimal_js_1.Decimal(p.creditLimit || 0).mul(exchangeRate));
        }, new decimal_js_1.Decimal(0));
        return {
            totalReceivable: totalReceivable.toNumber(),
            totalCreditLimit: totalCreditLimit.toNumber(),
            exposurePercentage: totalCreditLimit.gt(0) ? totalReceivable.div(totalCreditLimit).mul(100).toNumber() : 0
        };
    }
    async getHealthMetrics() {
        const all = await this.partyRepo.find({ where: { state: 1 }, relations: ['currency'] });
        const atRisk = all.filter(p => {
            const exchangeRate = p.currency?.exchangeRate || new decimal_js_1.Decimal(1);
            const tlBalance = new decimal_js_1.Decimal(p.balance || 0).mul(exchangeRate);
            const tlLimit = new decimal_js_1.Decimal(p.creditLimit || 0).mul(exchangeRate);
            return tlLimit.gt(0) && tlBalance.gte(tlLimit.mul(0.9));
        });
        return {
            healthyCount: all.length - atRisk.length,
            atRiskCount: atRisk.length,
            requiresAttention: atRisk.map(p => ({ id: p.id, name: p.name, balance: p.balance, limit: p.creditLimit }))
        };
    }
};
exports.PartiesService = PartiesService;
exports.PartiesService = PartiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(party_entity_1.Party)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        currencies_service_1.CurrenciesService])
], PartiesService);
//# sourceMappingURL=parties.service.js.map