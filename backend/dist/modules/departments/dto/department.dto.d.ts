export declare class CreateDepartmentDto {
    name: string;
    description?: string;
    abbreviation?: string;
    commercialAccountId?: number;
}
export declare class UpdateDepartmentDto {
    name?: string;
    description?: string;
    abbreviation?: string;
    commercialAccountId?: number;
    state?: number;
}
