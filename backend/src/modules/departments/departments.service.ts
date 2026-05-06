import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { DepartmentType } from './entities/department-type.entity';
import { User } from '../auth/entities/user.entity';
import { Stock } from '../inventory/stocks/entities/stock.entity';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateDepartmentTypeDto, UpdateDepartmentTypeDto, DepartmentsQueryDto } from './dto/department.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { getSafeSearchPattern } from '../../common/utils/sql.helper';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private deptRepo: Repository<Department>,
    @InjectRepository(DepartmentType)
    private typeRepo: Repository<DepartmentType>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
  ) {}

  async findAll(query: DepartmentsQueryDto): Promise<PaginatedResult<Department>> {
    const qb = this.deptRepo.createQueryBuilder('dept')
      .leftJoinAndSelect('dept.departmentType', 'type')
      .leftJoinAndSelect('dept.commercialAccount', 'account');
 
    if (query.search) {
      const s = getSafeSearchPattern(query.search);
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
 
    const allowedSortMap: Record<string, string> = {
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
    qb.orderBy(sortField, query.sortOrderSafe);

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

  async findOne(id: string): Promise<Department> {
    const dept = await this.deptRepo.findOne({ 
      where: { id: String(id) }, 
      relations: ['commercialAccount', 'departmentType'] 
    });
    if (!dept) throw new NotFoundException('Departman bulunamadı');
    return dept;
  }

  async create(dto: CreateDepartmentDto, userId: string): Promise<Department> {
    const dept = this.deptRepo.create({ ...dto, createdBy: userId });
    return this.deptRepo.save(dept);
  }

  async update(id: string, dto: UpdateDepartmentDto, userId: string): Promise<Department> {
    const dept = await this.findOne(id);
    
    if (dto.name !== undefined) dept.name = dto.name;
    if (dto.abbreviation !== undefined) dept.abbreviation = dto.abbreviation;
    if (dto.description !== undefined) dept.description = dto.description;
    if (dto.departmentTypeId !== undefined) dept.departmentTypeId = dto.departmentTypeId;
    if (dto.commercialAccountId !== undefined) dept.commercialAccountId = dto.commercialAccountId;
    if (dto.state !== undefined) dept.state = dto.state;

    dept.updatedBy = userId || null;
    return this.deptRepo.save(dept);
  }

  async softDelete(id: string): Promise<void> {
    await this.findOne(id);

    const hasUsers = await this.userRepo.count({ where: { departmentId: id } });
    if (hasUsers > 0) {
      throw new BadRequestException(`Bu departmana kayıtlı ${hasUsers} adet personel bulunduğu için silinemez.`);
    }

    const hasStock = await this.stockRepo.count({ where: { departmentId: id } });
    if (hasStock > 0) {
      throw new BadRequestException(`Bu departmanda/depoda kayıtlı stok verisi bulunduğu için silinemez.`);
    }

    await this.deptRepo.softDelete(id);
  }

  async findAllTypes(): Promise<DepartmentType[]> {
    return this.typeRepo.find();
  }

  async createType(dto: CreateDepartmentTypeDto, userId: string): Promise<DepartmentType> {
    const type = this.typeRepo.create({ ...dto, createdBy: userId });
    return this.typeRepo.save(type);
  }

  async updateType(id: string, dto: UpdateDepartmentTypeDto, userId: string): Promise<DepartmentType> {
    const type = await this.typeRepo.findOne({ where: { id: String(id) } });
    if (!type) throw new NotFoundException('Departman türü bulunamadı');
    
    if (dto.name !== undefined) type.name = dto.name;
    if (dto.abbreviation !== undefined) type.abbreviation = dto.abbreviation;

    type.updatedBy = userId || null;
    return this.typeRepo.save(type);
  }

  async softDeleteType(id: string): Promise<void> {
    const type = await this.typeRepo.findOne({ where: { id: String(id) } });
    if (!type) throw new NotFoundException('Departman türü bulunamadı');

    const usedCount = await this.deptRepo.count({ where: { departmentTypeId: id } });
    if (usedCount > 0) {
      throw new BadRequestException(`Bu türü kullanan ${usedCount} adet departman bulunduğu için silinemez.`);
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
      structureScore: Math.min(100, Math.round(((active + withAccount) / ( (active + passive) * 2 || 1)) * 100))
    };
  }
}
