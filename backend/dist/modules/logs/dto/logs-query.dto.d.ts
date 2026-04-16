export declare class LogsQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    module?: string;
    action?: string;
    tag?: string;
    userId?: string;
}
