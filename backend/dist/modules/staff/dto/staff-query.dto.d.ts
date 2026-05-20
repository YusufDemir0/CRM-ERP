export declare class StaffQueryDto {
    search?: string;
    departmentId?: string;
    state?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    get skip(): number;
}
