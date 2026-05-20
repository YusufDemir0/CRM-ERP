import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { DepartmentType } from './entities/department-type.entity';
import { User } from '../auth/entities/user.entity';
import { Stock } from '../inventory/stocks/entities/stock.entity';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateDepartmentTypeDto, UpdateDepartmentTypeDto, DepartmentsQueryDto } from './dto/department.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class DepartmentsService {
    private deptRepo;
    private typeRepo;
    private userRepo;
    private stockRepo;
    constructor(deptRepo: Repository<Department>, typeRepo: Repository<DepartmentType>, userRepo: Repository<User>, stockRepo: Repository<Stock>);
    findAll(query: DepartmentsQueryDto): Promise<PaginatedResult<Department>>;
    findOne(id: string): Promise<Department>;
    create(dto: CreateDepartmentDto, userId: string): Promise<Department>;
    update(id: string, dto: UpdateDepartmentDto, userId: string): Promise<Department>;
    softDelete(id: string): Promise<void>;
    findAllTypes(): Promise<DepartmentType[]>;
    createType(dto: CreateDepartmentTypeDto, userId: string): Promise<DepartmentType>;
    updateType(id: string, dto: UpdateDepartmentTypeDto, userId: string): Promise<DepartmentType>;
    softDeleteType(id: string): Promise<void>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        withAccount: number;
        structureScore: number;
    }>;
}
