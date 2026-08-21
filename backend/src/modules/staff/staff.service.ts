import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Staff } from './entities/staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async create(createStaffDto: CreateStaffDto, userId: string) {
    const staff = this.staffRepository.create({
      ...createStaffDto,
      unit: createStaffDto.unit || 'MAĞAZA',
      entryDate: createStaffDto.entryDate || new Date().toISOString().split('T')[0],
      createdBy: userId,
      updatedBy: userId,
    });
    return await this.staffRepository.save(staff);
  }

  async findAll(query: { departmentId: string; page?: number; limit?: number; state?: number }) {
    const qb = this.staffRepository.createQueryBuilder('staff')
      .leftJoinAndSelect('staff.department', 'department')
      .where('staff.deletedAt IS NULL');

    if (query.departmentId) {
      qb.andWhere('staff.departmentId = :departmentId', { departmentId: query.departmentId });
    }

    if (query.state !== undefined) {
      qb.andWhere('staff.state = :state', { state: query.state });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const staff = await this.staffRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['department'],
    });
    if (!staff) throw new NotFoundException('Personel bulunamadı');
    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto, userId: string) {
    const staff = await this.findOne(id);
    if (updateStaffDto.state !== undefined && staff.state !== updateStaffDto.state) {
      const today = new Date().toISOString().split('T')[0];
      if (updateStaffDto.state === 0) {
        staff.lastDeactivationDate = today;
      } else if (updateStaffDto.state === 1) {
        staff.entryDate = today;
      }
    }

    Object.assign(staff, {
      ...updateStaffDto,
      updatedBy: userId,
    });
    return await this.staffRepository.save(staff);
  }

  async remove(id: string, userId: string) {
    const staff = await this.findOne(id);
    staff.deletedAt = new Date();
    staff.updatedBy = userId;
    return await this.staffRepository.save(staff);
  }

  async toggleActive(id: string, userId: string) {
    const staff = await this.findOne(id);
    staff.isActive = !staff.isActive;
    staff.state = staff.isActive ? 1 : 0;
    
    const today = new Date().toISOString().split('T')[0];
    if (staff.state === 0) {
      staff.lastDeactivationDate = today;
    } else {
      staff.entryDate = today;
    }
    
    staff.updatedBy = userId;
    return await this.staffRepository.save(staff);
  }
}
