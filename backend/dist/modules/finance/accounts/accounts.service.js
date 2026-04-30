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
const decimal_js_1 = require("decimal.js");
const currencies_service_1 = require("../currencies/currencies.service");
const ledger_entity_1 = require("../../parties/entities/ledger.entity");
const sql_helper_1 = require("../../../common/utils/sql.helper");
let AccountsService = class AccountsService {
    constructor(accRepo, dataSource, currenciesService) {
        this.accRepo = accRepo;
        this.dataSource = dataSource;
        this.currenciesService = currenciesService;
    }
    async findAll(query) {
        const qb = this.accRepo.createQueryBuilder('acc')
            .leftJoinAndSelect('acc.currency', 'currency');
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            const cleanTerm = query.search.replace(/[\s-]/g, '').replace(/^TR/i, '');
            const cleanS = (0, sql_helper_1.getSafeSearchPattern)(cleanTerm);
            qb.andWhere('(acc.name LIKE :s OR acc.bankName LIKE :s OR acc.description LIKE :s OR acc.iban LIKE :s OR REPLACE(REPLACE(acc.iban, " ", ""), "TR", "") LIKE :cleanS)', { s, cleanS });
        }
        if (query.state !== undefined) {
            qb.andWhere('acc.state = :state', { state: query.state });
        }
        const allowedSortCols = ['name', 'bankName', 'iban', 'criticalLimit', 'createdAt'];
        const sortField = allowedSortCols.includes(query.sortBy || '') ? query.sortBy : 'name';
        qb.orderBy(`acc.${sortField}`, query.sortOrderSafe);
        qb.skip(query.skip).take(query.limit);
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
        if (!dto.currencyId) {
            try {
                const defaultCurrency = await this.currenciesService.getDefault();
                dto.currencyId = Number(defaultCurrency.id);
            }
            catch (error) {
                console.warn('Default currency not found in AccountsService, setting to null');
            }
        }
        const acc = this.accRepo.create({
            ...dto,
            criticalLimit: dto.criticalLimit !== undefined ? new decimal_js_1.Decimal(dto.criticalLimit) : undefined,
            createdBy: userId
        });
        return this.accRepo.save(acc);
    }
    async update(id, dto, userId) {
        const acc = await this.findOne(id);
        if (dto.name !== undefined)
            acc.name = dto.name;
        if (dto.bankName !== undefined)
            acc.bankName = dto.bankName;
        if (dto.iban !== undefined)
            acc.iban = dto.iban;
        if (dto.ibanName !== undefined)
            acc.ibanName = dto.ibanName;
        if (dto.currencyId !== undefined)
            acc.currencyId = dto.currencyId;
        if (dto.criticalLimit !== undefined)
            acc.criticalLimit = new decimal_js_1.Decimal(dto.criticalLimit);
        if (dto.description !== undefined)
            acc.description = dto.description;
        if (dto.state !== undefined)
            acc.state = dto.state;
        acc.updatedBy = userId || null;
        return this.accRepo.save(acc);
    }
    async softDelete(id) {
        await this.findOne(id);
        await this.accRepo.softDelete(id);
    }
    async getStatus() {
        const [counts, balances] = await Promise.all([
            this.accRepo.createQueryBuilder('acc')
                .select("COUNT(*)", "total")
                .addSelect("SUM(CASE WHEN acc.state = 1 THEN 1 ELSE 0 END)", "active")
                .addSelect("SUM(CASE WHEN acc.state = 0 THEN 1 ELSE 0 END)", "passive")
                .getRawOne(),
            this.dataSource.getRepository(ledger_entity_1.AccountingLedger).createQueryBuilder('al')
                .select("SUM(al.debit - al.credit)", "balance")
                .where("al.accountId IS NOT NULL")
                .getRawOne(),
        ]);
        return {
            active: Number(counts.active || 0),
            passive: Number(counts.passive || 0),
            total: Number(counts.total || 0),
            totalBalance: new decimal_js_1.Decimal(balances.balance || 0).toFixed(2),
        };
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(commercial_account_entity_1.CommercialAccount)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        currencies_service_1.CurrenciesService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map