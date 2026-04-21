import { Repository } from 'typeorm';
import { Staff } from './entities/staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
export declare class StaffService {
    private readonly staffRepository;
    constructor(staffRepository: Repository<Staff>);
    create(createStaffDto: CreateStaffDto, userId: number): Promise<Staff>;
    findAll(query: {
        departmentId?: number;
        page?: number;
        limit?: number;
    }): Promise<{
        data: Staff[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<Staff>;
    update(id: number, updateStaffDto: UpdateStaffDto, userId: number): Promise<Staff>;
    remove(id: number, userId: number): Promise<Staff>;
    toggleActive(id: number, userId: number): Promise<Staff>;
}
