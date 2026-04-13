import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<User>> {
    const qb = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .leftJoinAndSelect('user.roles', 'roles')
      .select([
        'user.id', 'user.username', 'user.fullName', 'user.email',
        'user.phone', 'user.departmentId', 'user.state', 'user.createdAt',
        'department.id', 'department.name',
        'roles.id', 'roles.name',
      ]);

    if (query.search) {
      qb.where('(user.fullName LIKE :search OR user.username LIKE :search OR user.email LIKE :search OR department.name LIKE :search OR roles.name LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy(`user.${query.sortBy || 'createdAt'}`, query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['department', 'roles'],
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return user;
  }

  async create(dto: CreateUserDto, currentUserId?: number): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existing) throw new ConflictException('Kullanıcı adı veya email zaten mevcut');

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepo.create({
      username: dto.username,
      passwordHash,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone || null,
      departmentId: dto.departmentId || null,
      createdBy: currentUserId || null,
    });

    return this.userRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto, currentUserId?: number): Promise<User> {
    const user = await this.findOne(id);
    
    // Şifre güncellenmek isteniyorsa güvenli şekilde hash'le
    if (dto.password && dto.password.trim() !== '') {
      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(dto.password, salt);
    }
    // Explicit mapping to prevent mass assignment
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.departmentId !== undefined) user.departmentId = dto.departmentId;
    if (dto.state !== undefined) user.state = dto.state;

    user.updatedBy = currentUserId || null;
    return this.userRepo.save(user);
  }

  async softDelete(id: number, currentUserId?: number): Promise<void> {
    const user = await this.findOne(id);
    user.updatedBy = currentUserId || null;
    await this.userRepo.save(user);
    await this.userRepo.softDelete(id);
  }

  async getStatus() {
    const[active, passive, total, adminCount] = await Promise.all([
      this.userRepo.count({ where: { state: 1 } }),
      this.userRepo.count({ where: { state: 0 } }),
      this.userRepo.count(),
      this.userRepo.createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.name = :role', { role: 'admin' })
        .getCount(),
    ]);
    return { active, passive, total, adminCount };
  }
}