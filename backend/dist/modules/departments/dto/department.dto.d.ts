import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateDepartmentDto {
    name: string;
    description?: string;
    abbreviation?: string;
    departmentTypeId: string;
    commercialAccountId: string;
    cityId: string;
}
export declare class UpdateDepartmentDto {
    name?: string;
    description?: string;
    abbreviation?: string;
    departmentTypeId: string | null;
    commercialAccountId: string | null;
    cityId: string | null;
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
    departmentTypeId: string;
    commercialAccountId: string;
    state?: number;
    search?: string;
}
