import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { DepartmentType } from './entities/department-type.entity';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateDepartmentTypeDto, UpdateDepartmentTypeDto } from './dto/department.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
export declare class DepartmentsService {
    private deptRepo;
    private typeRepo;
    constructor(deptRepo: Repository<Department>, typeRepo: Repository<DepartmentType>);
    findAll(query: PaginationDto): Promise<PaginatedResult<Department>>;
    findOne(id: number): Promise<Department>;
    create(dto: CreateDepartmentDto, userId?: number): Promise<Department>;
    update(id: number, dto: UpdateDepartmentDto, userId?: number): Promise<Department>;
    softDelete(id: number): Promise<void>;
    findAllTypes(): Promise<DepartmentType[]>;
    createType(dto: CreateDepartmentTypeDto, userId?: number): Promise<DepartmentType>;
    updateType(id: number, dto: UpdateDepartmentTypeDto, userId?: number): Promise<DepartmentType>;
    softDeleteType(id: number): Promise<void>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        withAccount: number;
        structureScore: number;
    }>;
}
