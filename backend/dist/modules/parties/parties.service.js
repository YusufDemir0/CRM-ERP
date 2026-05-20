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
const crypto = __importStar(require("crypto"));
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const party_entity_1 = require("./entities/party.entity");
const currencies_service_1 = require("../finance/currencies/currencies.service");
const decimal_js_1 = require("decimal.js");
const sql_helper_1 = require("../../common/utils/sql.helper");
const sale_entity_1 = require("../sales/entities/sale.entity");
let PartiesService = class PartiesService {
    constructor(partyRepo, currenciesService) {
        this.partyRepo = partyRepo;
        this.currenciesService = currenciesService;
    }
    async lookup(type) {
        const qb = this.partyRepo.createQueryBuilder('party')
            .select([
            'party.id', 'party.name', 'party.type', 'party.currencyId',
            'party.phone1', 'party.phone2', 'party.email', 'party.taxNumber',
            'party.address', 'party.cityId', 'party.districtName'
        ])
            .where('party.state = :state', { state: 1 });
        if (type) {
            qb.andWhere('party.type = :type', { type });
        }
        return qb.orderBy('party.name', 'ASC').getMany();
    }
    async findAll(query) {
        const qb = this.partyRepo.createQueryBuilder('party')
            .select([
            'party.id', 'party.name', 'party.type', 'party.state',
            'party.taxNumber', 'party.taxOffice', 'party.phone1', 'party.phone2',
            'party.email', 'party.balance', 'party.address', 'party.cityId',
            'party.districtName', 'party.creditLimit', 'party.currencyId', 'party.notes'
        ])
            .leftJoin('party.currency', 'currency')
            .addSelect(['currency.id', 'currency.symbol', 'currency.code']);
        if (query.departmentId) {
            qb.innerJoin('users', 'u', 'u.id = party.created_by AND u.department_id = :departmentId', { departmentId: query.departmentId });
        }
        if (query.search) {
            qb.andWhere('(party.name LIKE :s OR party.phone1 LIKE :s OR party.phone2 LIKE :s OR party.taxOffice LIKE :s OR party.taxNumber LIKE :s OR party.email LIKE :s OR party.address LIKE :s OR party.districtName LIKE :s OR party.notes LIKE :s)', { s: `%${query.search}%` });
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
        qb.orderBy(`party.${sortCol}`, query.sortOrderSafe);
        qb.skip(query.skip).take(query.limit);
        qb.addSelect((subQuery) => {
            return subQuery
                .select('COUNT(sale.id)')
                .from('sales', 'sale')
                .where('sale.party_id = party.id')
                .andWhere('sale.deleted_at IS NULL');
        }, 'total_sales_count');
        qb.addSelect((subQuery) => {
            return subQuery
                .select('MAX(sale.created_at)')
                .from('sales', 'sale')
                .where('sale.party_id = party.id')
                .andWhere('sale.deleted_at IS NULL');
        }, 'last_sale_date');
        const { entities, raw } = await qb.getRawAndEntities();
        const count = await qb.getCount();
        const rawMap = new Map(raw.map(r => [r.party_id.toString(), r]));
        entities.forEach(entity => {
            const rawData = rawMap.get(entity.id.toString());
            if (rawData) {
                entity.totalSalesCount = Number(rawData.total_sales_count || 0);
                entity.lastSaleDate = rawData.last_sale_date || null;
                entity.calculatedBalance = new decimal_js_1.Decimal(entity.balance || 0);
            }
        });
        return {
            data: entities,
            meta: { total: count, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(count / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const party = await this.partyRepo.findOne({ where: { id: String(id) }, relations: ['currency'] });
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
                dto.currencyId = String(defaultCurrency.id);
            }
            catch (error) {
                console.warn('Default currency not found, setting to null');
            }
        }
        const party = this.partyRepo.create({ ...dto, balance: new decimal_js_1.Decimal(0), createdBy: userId, departmentId: dto.departmentId });
        return this.partyRepo.save(party);
    }
    async update(id, dto, userId) {
        const party = await this.findOne(id);
        if (dto.taxNumber && dto.taxNumber !== party.taxNumber) {
            const existing = await this.partyRepo.findOne({ where: { taxNumber: dto.taxNumber } });
            if (existing && existing.id !== String(id)) {
                throw new common_1.BadRequestException(`'${dto.taxNumber}' vergi numarası ile başka bir cari mevcut (${existing.name}).`);
            }
        }
        const fields = [
            'name', 'type', 'phone1', 'phone2', 'taxOffice', 'taxNumber', 'email',
            'address', 'cityId', 'districtName', 'paymentTerms', 'currencyId', 'notes', 'state', 'departmentId'
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
        const activeSales = await this.partyRepo.manager.getRepository(sale_entity_1.Sale).count({
            where: { partyId: id, status: (0, typeorm_2.In)(['draft', 'approved', 'shipped']) }
        });
        if (activeSales > 0) {
            throw new common_1.BadRequestException(`Bu cari hesaba ait ${activeSales} adet aktif satış/sipariş bulunmaktadır. ` +
                `Önce bunları iptal etmeli veya tamamlamalısınız.`);
        }
        const suffix = `_del_${crypto.randomUUID().substring(0, 8)}`;
        await this.partyRepo.update(id, {
            taxNumber: `${party.taxNumber || id}${suffix}`.substring(0, 50),
            state: 0,
        });
        await this.partyRepo.softDelete(id);
    }
    async getBalance(id) {
        const party = await this.findOne(id);
        return {
            balance: new decimal_js_1.Decimal(party.balance || 0).toFixed(2),
            creditLimit: new decimal_js_1.Decimal(party.creditLimit || 0).toFixed(2),
            currency: party.currency?.code || 'TRY',
            symbol: party.currency?.symbol || '₺'
        };
    }
    async getStatus() {
        const stats = await this.partyRepo.createQueryBuilder('party')
            .leftJoin('party.currency', 'currency')
            .select([
            "COUNT(CASE WHEN party.state = 1 THEN 1 END) as active",
            "COUNT(CASE WHEN party.state = 0 THEN 1 END) as passive",
            "SUM(party.balance * COALESCE(currency.exchangeRate, 1)) as total_receivable",
            "SUM(party.creditLimit * COALESCE(currency.exchangeRate, 1)) as total_credit_limit"
        ])
            .getRawOne();
        const atRiskCount = await this.partyRepo.createQueryBuilder('party')
            .leftJoin('party.currency', 'currency')
            .where('party.state = 1')
            .andWhere('party.credit_limit > 0')
            .andWhere('ABS(party.balance * COALESCE(currency.exchangeRate, 1)) >= (party.credit_limit * COALESCE(currency.exchangeRate, 1) * 0.9)')
            .getCount();
        const totalReceivable = new decimal_js_1.Decimal(stats.total_receivable || 0);
        const totalCreditLimit = new decimal_js_1.Decimal(stats.total_credit_limit || 0);
        return {
            active: Number(stats.active || 0),
            passive: Number(stats.passive || 0),
            totalReceivable: totalReceivable.toFixed(2),
            exposurePercentage: totalCreditLimit.gt(0) ? totalReceivable.div(totalCreditLimit).mul(100).toDecimalPlaces(0).toNumber() : 0,
            atRiskCount
        };
    }
    async getGlobalExposure() {
        const stats = await this.partyRepo.createQueryBuilder('party')
            .leftJoin('party.currency', 'currency')
            .select([
            "SUM(party.balance * COALESCE(currency.exchangeRate, 1)) as total_receivable",
            "SUM(party.creditLimit * COALESCE(currency.exchangeRate, 1)) as total_credit_limit"
        ])
            .getRawOne();
        const totalReceivable = new decimal_js_1.Decimal(stats.total_receivable || 0);
        const totalCreditLimit = new decimal_js_1.Decimal(stats.total_credit_limit || 0);
        return {
            totalReceivable: totalReceivable.toFixed(2),
            totalCreditLimit: totalCreditLimit.toFixed(2),
            exposurePercentage: totalCreditLimit.gt(0) ? totalReceivable.div(totalCreditLimit).mul(100).toDecimalPlaces(2).toNumber() : 0
        };
    }
    async getHealthMetrics() {
        const allCount = await this.partyRepo.count({ where: { state: 1 } });
        const atRisk = await this.partyRepo.createQueryBuilder('party')
            .leftJoin('party.currency', 'currency')
            .select(['party.id', 'party.name', 'party.balance', 'party.creditLimit'])
            .where('party.state = 1')
            .andWhere('party.credit_limit > 0')
            .andWhere('(party.balance * COALESCE(currency.exchangeRate, 1)) >= (party.credit_limit * COALESCE(currency.exchangeRate, 1) * 0.9)')
            .getMany();
        return {
            healthyCount: allCount - atRisk.length,
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