import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Repository, In, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { Transactional } from '../../common/decorators/transactional.decorator';
import { TransactionContextService } from '../../common/services/transaction-context.service';
import { Department } from '../departments/entities/department.entity';
import { getSafeSearchPattern } from '../../common/utils/sql.helper';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private transactionContext: TransactionContextService,
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
      const searchPattern = getSafeSearchPattern(query.search);
      if (searchPattern) {
        qb.where(
          '(user.fullName LIKE :search OR user.username LIKE :search OR user.email LIKE :search OR department.name LIKE :search OR roles.name LIKE :search)',
          { search: searchPattern },
        );
      }
    }

    if (query.state !== undefined) {
      qb.andWhere('user.state = :state', { state: query.state });
    }

    const sortFieldMap: Record<string, string> = {
      'fullName': 'user.fullName',
      'username': 'user.username',
      'email': 'user.email',
      'createdAt': 'user.createdAt',
      'department.name': 'department.name',
      'roles.name': 'roles.name'
    };

    // Security: Whitelist sort columns
    const allowedSortCols = ['fullName', 'username', 'email', 'createdAt', 'department.name', 'roles.name'];
    const sortCol = allowedSortCols.includes(query.sortBy || '') ? sortFieldMap[query.sortBy!] : 'user.createdAt';
    qb.orderBy(sortCol, query.sortOrder || 'DESC');
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

  @Transactional()
  async create(dto: CreateUserDto, currentUserId?: number): Promise<User> {
    const manager = this.transactionContext.manager;

    // DB-02: Use explicit locking to prevent registration deadlocks/race conditions
    const existing = await manager.findOne(User, {
      where: [{ username: dto.username }, { email: dto.email }],
      lock: { mode: 'pessimistic_write' }
    });
    if (existing) throw new ConflictException('Kullanıcı adı veya email zaten mevcut');

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = manager.create(User, {
      username: dto.username,
      passwordHash,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone || null,
      departmentId: dto.departmentId || null,
      createdBy: currentUserId || null,
    });

    if (dto.roleIds && dto.roleIds.length > 0) {
      user.roles = await manager.find(Role, {
        where: { id: In(dto.roleIds) }
      });
    }

    return manager.save(user);
  }

  async update(id: number, dto: UpdateUserDto, currentUserId?: number): Promise<User> {
    const user = await this.findOne(id);
    
    if (dto.username && dto.username !== user.username) {
      const existing = await this.userRepo.findOne({ where: { username: dto.username } });
      if (existing && existing.id !== id) throw new ConflictException('Kullanıcı adı zaten mevcut');
      user.username = dto.username;
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existing && existing.id !== id) throw new ConflictException('Email zaten mevcut');
      user.email = dto.email;
    }

    // Şifre güncellenmek isteniyorsa güvenli şekilde hash'le
    if (dto.password && dto.password.trim() !== '') {
      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(dto.password, salt);
      // Oturumları iptal et (Şifre değişince tüm cihazlardan çıkış)
      user.tokenVersion += 1;
    }
    // Explicit mapping to prevent mass assignment
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.departmentId !== undefined) {
      user.department = dto.departmentId ? ({ id: dto.departmentId } as unknown as Department) : null as unknown as Department;
      user.departmentId = dto.departmentId || null;
    }

    if (dto.roleIds !== undefined) {
      if (dto.roleIds.length > 0) {
        user.roles = await this.roleRepo.find({
          where: { id: In(dto.roleIds) }
        });
      } else {
        user.roles = [];
      }
    }
    
    if (dto.state !== undefined && user.state !== dto.state) {
      user.state = dto.state;
      // Durum değişince oturumları iptal et (Kovulma/Dondurma anında iptal)
      user.tokenVersion += 1;
      
      const today = new Date().toISOString().split('T')[0];
      if (dto.state === 0) {
        user.lastDeactivationDate = today;
      } else if (dto.state === 1) {
        user.entryDate = today;
      }
    }

    user.updatedBy = currentUserId || null;
    const savedUser = await this.userRepo.save(user);

    // SEC-07: Immediate Cache Invalidation
    // If state or tokenVersion changed, clear the cache to enforce immediate redirection/logout
    if (dto.password || dto.state !== undefined) {
      await this.cacheManager.del(`user_state_${id}`);
    }

    return savedUser;
  }

  async softDelete(id: number, currentUserId?: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const timestamp = Date.now();
    // Unique alanları damgala ki aynı değerler tekrar kullanılabilsin
    await this.userRepo.update(id, {
      username: `_DEL_${timestamp}_${user.username}`.substring(0, 100),
      email: `_DEL_${timestamp}_${user.email}`.substring(0, 150),
      state: 0,
      updatedBy: currentUserId || null,
    });
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