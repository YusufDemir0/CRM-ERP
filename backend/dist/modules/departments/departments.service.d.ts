import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
export declare class DepartmentsService {
    private deptRepo;
    constructor(deptRepo: Repository<Department>);
    findAll(query: PaginationDto): Promise<PaginatedResult<Department>>;
    findOne(id: number): Promise<Department>;
    create(dto: CreateDepartmentDto, userId?: number): Promise<Department>;
    update(id: number, dto: UpdateDepartmentDto, userId?: number): Promise<Department>;
    softDelete(id: number): Promise<void>;
}
