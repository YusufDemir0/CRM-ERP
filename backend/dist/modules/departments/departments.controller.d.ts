import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateDepartmentTypeDto, UpdateDepartmentTypeDto } from './dto/department.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class DepartmentsController {
    private readonly deptService;
    constructor(deptService: DepartmentsService);
    findAll(query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/department.entity").Department>>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        withAccount: number;
        structureScore: number;
    }>;
    findAllTypes(): Promise<import("./entities/department-type.entity").DepartmentType[]>;
    createType(dto: CreateDepartmentTypeDto, userId: string): Promise<import("./entities/department-type.entity").DepartmentType>;
    updateType(id: string, dto: UpdateDepartmentTypeDto, userId: string): Promise<import("./entities/department-type.entity").DepartmentType>;
    removeType(id: string): Promise<void>;
    findOne(id: string): Promise<import("./entities/department.entity").Department>;
    create(dto: CreateDepartmentDto, userId: string): Promise<import("./entities/department.entity").Department>;
    update(id: string, dto: UpdateDepartmentDto, userId: string): Promise<import("./entities/department.entity").Department>;
    remove(id: string): Promise<void>;
}
