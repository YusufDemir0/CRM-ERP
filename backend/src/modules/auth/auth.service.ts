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

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('INVALID_PASSWORD');
    }

    if (user.state !== 1) {
      throw new UnauthorizedException('Hesabınız devre dışı bırakılmıştır');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      departmentId: user.departmentId,
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
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'department'],
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    const userRoles = await this.userRoleRepo.find({ where: { userId }, relations: ['role'] });
    const roleIds = userRoles.map(ur => ur.roleId);
    
    let permissions: string[] = [];
    if (roleIds.length > 0) {
      const rolePerms = await this.rolePermRepo.find({
        where: { roleId: In(roleIds) },
        relations: ['permission']
      });
      permissions = rolePerms.map(rp => rp.permission?.key).filter(Boolean);
    }
    
    const userPerms = await this.userPermRepo.find({ where: { userId }, relations: ['permission'] });
    const userAllowKeys = userPerms.filter(up => up.effect === 'allow').map(up => up.permission?.key);
    const userDenyKeys = userPerms.filter(up => up.effect === 'deny').map(up => up.permission?.key);
    
    const finalPermissions = Array.from(new Set([...permissions, ...userAllowKeys])).filter(key => !userDenyKeys.includes(key));

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
