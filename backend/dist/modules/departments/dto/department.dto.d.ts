import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateDepartmentDto {
    name: string;
    description?: string;
    abbreviation?: string;
    departmentTypeId?: number;
    commercialAccountId?: number;
    cityId?: number;
}
export declare class UpdateDepartmentDto {
    name?: string;
    description?: string;
    abbreviation?: string;
    departmentTypeId?: number;
    commercialAccountId?: number;
    cityId?: number;
    state?: number;
}
export declare class CreateDepartmentTypeDto {
    name: string;
    abbreviation: string;
}
export declare class UpdateDepartmentTypeDto {
    name?: string;
    abbreviation?: string;
    state?: number;
}
export declare class DepartmentsQueryDto extends PaginationDto {
    departmentTypeId?: number;
    commercialAccountId?: number;
    state?: number;
    search?: string;
}
