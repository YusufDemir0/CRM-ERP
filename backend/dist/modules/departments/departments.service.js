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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_entity_1 = require("./entities/department.entity");
const department_type_entity_1 = require("./entities/department-type.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const stock_entity_1 = require("../inventory/stocks/entities/stock.entity");
const sql_helper_1 = require("../../common/utils/sql.helper");
let DepartmentsService = class DepartmentsService {
    constructor(deptRepo, typeRepo, userRepo, stockRepo) {
        this.deptRepo = deptRepo;
        this.typeRepo = typeRepo;
        this.userRepo = userRepo;
        this.stockRepo = stockRepo;
    }
    async findAll(query) {
        const qb = this.deptRepo.createQueryBuilder('dept')
            .leftJoinAndSelect('dept.departmentType', 'type')
            .leftJoinAndSelect('dept.commercialAccount', 'account');
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.andWhere('(dept.name LIKE :s OR dept.abbreviation LIKE :s OR dept.description LIKE :s OR type.name LIKE :s OR account.name LIKE :s)', { s });
        }
        if (query.departmentTypeId) {
            qb.andWhere('dept.departmentTypeId = :typeId', { typeId: query.departmentTypeId });
        }
        if (query.commercialAccountId) {
            qb.andWhere('dept.commercialAccountId = :accountId', { accountId: query.commercialAccountId });
        }
        if (query.state !== undefined) {
            qb.andWhere('dept.state = :state', { state: query.state });
        }
        const allowedSortMap = {
            'name': 'dept.name',
            'abbreviation': 'dept.abbreviation',
            'description': 'dept.description',
            'createdAt': 'dept.createdAt',
            'departmentType.name': 'type.name',
            'type.name': 'type.name',
            'commercialAccount.name': 'account.name',
            'account.name': 'account.name',
            'state': 'dept.state'
        };
        const sortField = allowedSortMap[query.sortBy || ''] || 'dept.name';
        qb.orderBy(sortField, query.sortOrder || 'ASC');
        if (sortField !== 'dept.createdAt') {
            qb.addOrderBy('dept.createdAt', 'DESC');
        }
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const dept = await this.deptRepo.findOne({
            where: { id },
            relations: ['commercialAccount', 'departmentType']
        });
        if (!dept)
            throw new common_1.NotFoundException('Departman bulunamadı');
        return dept;
    }
    async create(dto, userId) {
        const dept = this.deptRepo.create({ ...dto, createdBy: userId });
        return this.deptRepo.save(dept);
    }
    async update(id, dto, userId) {
        const dept = await this.findOne(id);
        if (dto.name !== undefined)
            dept.name = dto.name;
        if (dto.abbreviation !== undefined)
            dept.abbreviation = dto.abbreviation;
        if (dto.description !== undefined)
            dept.description = dto.description;
        if (dto.departmentTypeId !== undefined)
            dept.departmentTypeId = dto.departmentTypeId;
        if (dto.commercialAccountId !== undefined)
            dept.commercialAccountId = dto.commercialAccountId;
        if (dto.state !== undefined)
            dept.state = dto.state;
        dept.updatedBy = userId || null;
        return this.deptRepo.save(dept);
    }
    async softDelete(id) {
        await this.findOne(id);
        const hasUsers = await this.userRepo.count({ where: { departmentId: id } });
        if (hasUsers > 0) {
            throw new common_1.BadRequestException(`Bu departmana kayıtlı ${hasUsers} adet personel bulunduğu için silinemez.`);
        }
        const hasStock = await this.stockRepo.count({ where: { departmentId: id } });
        if (hasStock > 0) {
            throw new common_1.BadRequestException(`Bu departmanda/depoda kayıtlı stok verisi bulunduğu için silinemez.`);
        }
        await this.deptRepo.softDelete(id);
    }
    async findAllTypes() {
        return this.typeRepo.find();
    }
    async createType(dto, userId) {
        const type = this.typeRepo.create({ ...dto, createdBy: userId });
        return this.typeRepo.save(type);
    }
    async updateType(id, dto, userId) {
        const type = await this.typeRepo.findOne({ where: { id } });
        if (!type)
            throw new common_1.NotFoundException('Departman türü bulunamadı');
        if (dto.name !== undefined)
            type.name = dto.name;
        if (dto.abbreviation !== undefined)
            type.abbreviation = dto.abbreviation;
        type.updatedBy = userId || null;
        return this.typeRepo.save(type);
    }
    async softDeleteType(id) {
        const type = await this.typeRepo.findOne({ where: { id } });
        if (!type)
            throw new common_1.NotFoundException('Departman türü bulunamadı');
        const usedCount = await this.deptRepo.count({ where: { departmentTypeId: id } });
        if (usedCount > 0) {
            throw new common_1.BadRequestException(`Bu türü kullanan ${usedCount} adet departman bulunduğu için silinemez.`);
        }
        await this.typeRepo.softDelete(id);
    }
    async getStatus() {
        const [active, passive, withAccount] = await Promise.all([
            this.deptRepo.count({ where: { state: 1 } }),
            this.deptRepo.count({ where: { state: 0 } }),
            this.deptRepo.createQueryBuilder('dept')
                .where('dept.commercialAccountId IS NOT NULL')
                .getCount(),
        ]);
        return {
            active,
            passive,
            total: active + passive,
            withAccount,
            structureScore: Math.min(100, Math.round(((active + withAccount) / ((active + passive) * 2 || 1)) * 100))
        };
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(1, (0, typeorm_1.InjectRepository)(department_type_entity_1.DepartmentType)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map