import { Repository } from 'typeorm';
import { Staff } from './entities/staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
export declare class StaffService {
    private readonly staffRepository;
    constructor(staffRepository: Repository<Staff>);
    create(createStaffDto: CreateStaffDto, userId: string): Promise<Staff>;
    findAll(query: {
        departmentId: string;
        page?: number;
        limit?: number;
        state?: number;
    }): Promise<{
        data: Staff[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<Staff>;
    update(id: string, updateStaffDto: UpdateStaffDto, userId: string): Promise<Staff>;
    remove(id: string, userId: string): Promise<Staff>;
    toggleActive(id: string, userId: string): Promise<Staff>;
}
