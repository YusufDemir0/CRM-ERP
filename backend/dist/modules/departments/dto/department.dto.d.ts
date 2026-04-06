export declare class CreateDepartmentDto {
    name: string;
    description?: string;
    abbreviation?: string;
    departmentTypeId?: number;
    commercialAccountId?: number;
}
export declare class UpdateDepartmentDto {
    name?: string;
    description?: string;
    abbreviation?: string;
    departmentTypeId?: number;
    commercialAccountId?: number;
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
