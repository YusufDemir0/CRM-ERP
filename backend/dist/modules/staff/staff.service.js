"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const staff_entity_1 = require("./entities/staff.entity");
let StaffService = class StaffService {
    constructor(staffRepository) {
        this.staffRepository = staffRepository;
    }
    async create(createStaffDto, userId) {
        const staff = this.staffRepository.create({
            ...createStaffDto,
            unit: createStaffDto.unit || 'MAĞAZA',
            entryDate: createStaffDto.entryDate || new Date().toISOString().split('T')[0],
            createdBy: userId,
            updatedBy: userId,
        });
        return await this.staffRepository.save(staff);
    }
    async findAll(query) {
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
    async findOne(id) {
        const staff = await this.staffRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
            relations: ['department'],
        });
        if (!staff)
            throw new common_1.NotFoundException('Personel bulunamadı');
        return staff;
    }
    async update(id, updateStaffDto, userId) {
        const staff = await this.findOne(id);
        if (updateStaffDto.state !== undefined && staff.state !== updateStaffDto.state) {
            const today = new Date().toISOString().split('T')[0];
            if (updateStaffDto.state === 0) {
                staff.lastDeactivationDate = today;
            }
            else if (updateStaffDto.state === 1) {
                staff.entryDate = today;
            }
        }
        Object.assign(staff, {
            ...updateStaffDto,
            updatedBy: userId,
        });
        return await this.staffRepository.save(staff);
    }
    async remove(id, userId) {
        const staff = await this.findOne(id);
        staff.deletedAt = new Date();
        staff.updatedBy = userId;
        return await this.staffRepository.save(staff);
    }
    async toggleActive(id, userId) {
        const staff = await this.findOne(id);
        staff.isActive = !staff.isActive;
        staff.state = staff.isActive ? 1 : 0;
        const today = new Date().toISOString().split('T')[0];
        if (staff.state === 0) {
            staff.lastDeactivationDate = today;
        }
        else {
            staff.entryDate = today;
        }
        staff.updatedBy = userId;
        return await this.staffRepository.save(staff);
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(staff_entity_1.Staff)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StaffService);
//# sourceMappingURL=staff.service.js.map