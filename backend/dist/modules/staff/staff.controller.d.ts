import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    create(createStaffDto: CreateStaffDto, req: {
        user: {
            id: string;
        };
    }): Promise<import("./entities/staff.entity").Staff>;
    findAll(query: {
        departmentId: string;
        page?: number;
        limit?: number;
        state?: number;
    }): Promise<{
        data: import("./entities/staff.entity").Staff[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<import("./entities/staff.entity").Staff>;
    update(id: string, updateStaffDto: UpdateStaffDto, req: {
        user: {
            id: string;
        };
    }): Promise<import("./entities/staff.entity").Staff>;
    toggleActive(id: string, req: {
        user: {
            id: string;
        };
    }): Promise<import("./entities/staff.entity").Staff>;
    remove(id: string, req: {
        user: {
            id: string;
        };
    }): Promise<import("./entities/staff.entity").Staff>;
}
