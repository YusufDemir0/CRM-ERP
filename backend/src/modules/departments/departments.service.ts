import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { DepartmentType } from './entities/department-type.entity';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateDepartmentTypeDto, UpdateDepartmentTypeDto } from './dto/department.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private deptRepo: Repository<Department>,
    @InjectRepository(DepartmentType)
    private typeRepo: Repository<DepartmentType>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<Department>> {
    const qb = this.deptRepo.createQueryBuilder('dept')
      .leftJoinAndSelect('dept.departmentType', 'type')
      .leftJoinAndSelect('dept.commercialAccount', 'account');

    if (query.search) {
      qb.where('(dept.name LIKE :s OR dept.abbreviation LIKE :s OR dept.description LIKE :s OR type.name LIKE :s OR account.name LIKE :s)', { s: `%${query.search}%` });
    }

    if (query.state !== undefined) {
      qb.andWhere('dept.state = :state', { state: query.state });
    }

    qb.orderBy(`dept.${query.sortBy || 'name'}`, query.sortOrder || 'ASC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOne(id: number): Promise<Department> {
    const dept = await this.deptRepo.findOne({ 
      where: { id }, 
      relations: ['commercialAccount', 'departmentType'] 
    });
    if (!dept) throw new NotFoundException('Departman bulunamadı');
    return dept;
  }

  async create(dto: CreateDepartmentDto, userId?: number): Promise<Department> {
    const dept = this.deptRepo.create({ ...dto, createdBy: userId });
    return this.deptRepo.save(dept);
  }

  async update(id: number, dto: UpdateDepartmentDto, userId?: number): Promise<Department> {
    const dept = await this.findOne(id);
    Object.assign(dept, dto);
    dept.updatedBy = userId || null;
    return this.deptRepo.save(dept);
  }

  async softDelete(id: number): Promise<void> {
    await this.findOne(id);
    await this.deptRepo.softDelete(id);
  }

  // ─── DEPARTMENT TYPES ───
  async findAllTypes(): Promise<DepartmentType[]> {
    return this.typeRepo.find();
  }

  async createType(dto: CreateDepartmentTypeDto, userId?: number): Promise<DepartmentType> {
    const type = this.typeRepo.create({ ...dto, createdBy: userId });
    return this.typeRepo.save(type);
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
