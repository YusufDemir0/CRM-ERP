import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateDepartmentTypeDto } from './dto/department.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class DepartmentsController {
    private readonly deptService;
    constructor(deptService: DepartmentsService);
    findAll(query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/department.entity").Department>>;
    findAllTypes(): Promise<import("./entities/department-type.entity").DepartmentType[]>;
    createType(dto: CreateDepartmentTypeDto, userId: number): Promise<import("./entities/department-type.entity").DepartmentType>;
    findOne(id: number): Promise<import("./entities/department.entity").Department>;
    create(dto: CreateDepartmentDto, userId: number): Promise<import("./entities/department.entity").Department>;
    update(id: number, dto: UpdateDepartmentDto, userId: number): Promise<import("./entities/department.entity").Department>;
    remove(id: number): Promise<void>;
}
