import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private userPermRepo: Repository<UserPermission>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('INVALID_USERNAME');
    }

    if (user.state === 2) {
      throw new UnauthorizedException('Hesabınız kilitlenmiştir. Lütfen sistem yöneticisi ile iletişime geçiniz.');
    }

    if (user.state !== 1) {
      throw new UnauthorizedException('Hesabınız devre dışı bırakılmıştır');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      // Increment failed attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updates: any = { failedLoginAttempts: failedAttempts };
      
      if (failedAttempts >= 5) { // Increased from 3 to 5 for better UX
        updates.state = 2; // Locked
      }
      
      await this.userRepo.update(user.id, updates);
      throw new UnauthorizedException('INVALID_PASSWORD');
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0) {
      await this.userRepo.update(user.id, { failedLoginAttempts: 0 });
    }

    const payload = {
      sub: user.id,
      username: user.username,
      departmentId: user.departmentId,
      tokenVersion: user.tokenVersion,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        departmentId: user.departmentId,
        roles: user.roles?.map((r) => r.name) || [],
      },
    };
  }

  async register(dto: RegisterDto) {
    // Kullanıcı adı kontrolü
    const existingUser = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (existingUser) {
      throw new ConflictException('Bu kullanıcı adı veya email zaten kullanılıyor');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepo.create({
      username: dto.username,
      passwordHash,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone || null,
      departmentId: dto.departmentId || null,
    });

    const savedUser = await this.userRepo.save(user);

    return {
      id: savedUser.id,
      username: savedUser.username,
      fullName: savedUser.fullName,
      email: savedUser.email,
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('user.userPermissions', 'userPerm')
      .leftJoinAndSelect('userPerm.permission', 'userPermData')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    // Role tabanlı yetkiler
    const rolePermissions = user.roles?.flatMap(r => 
      r.permissions?.map(p => p.key) || []
    ) || [];

    // Kullanıcıya özel yetkiler (Allow/Deny)
    const userAllowKeys = user.userPermissions
      ?.filter(up => up.effect === 'allow')
      .map(up => up.permission?.key) || [];
    
    const userDenyKeys = user.userPermissions
      ?.filter(up => up.effect === 'deny')
      .map(up => up.permission?.key) || [];

    const finalPermissions = Array.from(new Set([...rolePermissions, ...userAllowKeys]))
      .filter(key => key && !userDenyKeys.includes(key));

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      departmentId: user.departmentId,
      department: user.department,
      roles: user.roles?.map((r) => ({ id: r.id, name: r.name })) || [],
      permissions: finalPermissions
    };
  }
}
