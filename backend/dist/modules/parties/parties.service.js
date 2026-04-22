"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const sql_helper_1 = require("../../common/utils/sql.helper");
let PartiesService = class PartiesService {
    constructor(partyRepo, currenciesService) {
        this.partyRepo = partyRepo;
        this.currenciesService = currenciesService;
    }
    async findAll(query) {
        const qb = this.partyRepo.createQueryBuilder('party')
            .leftJoinAndSelect('party.currency', 'currency');
        if (query.departmentId) {
            qb.innerJoin('users', 'u', 'u.id = party.createdBy AND u.department_id = :departmentId', { departmentId: query.departmentId });
        }
        if (query.search) {
            const searchPattern = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            if (searchPattern) {
                qb.andWhere('(party.name LIKE :s OR party.phone1 LIKE :s OR party.email LIKE :s OR party.taxNumber LIKE :s OR party.taxOffice LIKE :s OR party.districtName LIKE :s OR party.address LIKE :s OR party.notes LIKE :s OR currency.name LIKE :s)', { s: searchPattern });
            }
        }
        const partyFilterMap = {
            name: 'party.name',
            phone1: 'party.phone1',
            email: 'party.email',
            taxNumber: 'party.taxNumber',
            taxOffice: 'party.taxOffice',
            cityId: 'party.cityId',
            districtName: 'party.districtName',
        };
        Object.keys(query).forEach(key => {
            const dbCol = partyFilterMap[key];
            const val = query[key];
            if (dbCol && val !== undefined) {
                const searchPattern = (0, sql_helper_1.getSafeSearchPattern)(val.toString());
                if (searchPattern) {
                    qb.andWhere(`${dbCol} LIKE :${key}`, { [key]: searchPattern });
                }
            }
        });
        if (query.type) {
            const types = query.type.split(',');
            if (types.length > 1) {
                qb.andWhere('party.type IN (:...types)', { types });
            }
            else {
                qb.andWhere('party.type = :type', { type: query.type });
            }
        }
        if (query.state !== undefined) {
            qb.andWhere('party.state = :state', { state: query.state });
        }
        const allowedSortCols = ['name', 'balance', 'creditLimit', 'createdAt', 'taxNumber', 'phone1'];
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
        const party = this.partyRepo.create({ ...dto, balance: new decimal_js_1.Decimal(0), createdBy: userId });
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
        const dataSource = this.partyRepo.manager.connection;
        const { Sale } = await Promise.resolve().then(() => __importStar(require('../sales/entities/sale.entity')));
        const activeSales = await dataSource.getRepository(Sale).count({
            where: { partyId: id, status: (0, typeorm_2.In)(['draft', 'approved', 'shipped']) }
        });
        if (activeSales > 0) {
            throw new common_1.BadRequestException(`Bu cari hesaba ait ${activeSales} adet aktif satış/sipariş bulunmaktadır. ` +
                `Önce bunları iptal etmeli veya tamamlamalısınız.`);
        }
        const timestamp = Date.now();
        await this.partyRepo.update(id, {
            taxNumber: `_DEL_${timestamp}_${party.taxNumber || id}`.substring(0, 50),
            state: 0,
        });
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