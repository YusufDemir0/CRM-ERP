import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { LoginDto, RegisterDto, ForgotPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { RecordState } from '../../common/enums/record-state.enum';

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
  ) { }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
      relations: ['roles'],
    });

    if (!user) {
      // SEC-07: Perform a dummy comparison to normalize response time (prevents username enumeration)
      // We use a real bcrypt hash structure to ensure the comparison algorithm runs.
      const DUMMY_HASH = '$2b$12$d7R1A.L8P.Gv9D/7yU7kE7P.r7Y.e7r7r7r7r7r7r7r7r7r7r7r7r7'; 
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }


    if (user.state === 2) {
      throw new UnauthorizedException('Hesabınız kalıcı olarak kilitlenmiştir. Lütfen sistem yöneticisi ile iletişime geçiniz.');
    }

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - new Date().getTime()) / 60000);
      throw new UnauthorizedException(`Çok fazla hatalı deneme. Hesabınız ${remainingMinutes} dakika daha kilitli kalacaktır.`);
    }

    if (user.state !== 1) {
      throw new UnauthorizedException('Hesabınız devre dışı bırakılmıştır');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      // Increment failed attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updates: Partial<User> = { id: user.id, failedLoginAttempts: failedAttempts };

      if (failedAttempts >= 5) {
        // Lock for 15 minutes
        const lockDuration = 15 * 60 * 1000;
        updates.lockedUntil = new Date(Date.now() + lockDuration);
        updates.failedLoginAttempts = 0; // Reset counter but lock is active
      }

      await this.userRepo.update(user.id, updates);
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }

    // Reset failed attempts & lockout on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.userRepo.update(user.id, {
        id: user.id,
        failedLoginAttempts: 0,
        lockedUntil: null
      });
    }

    const payload = {
      sub: user.id,
      username: user.username,
      departmentId: user.departmentId,
      tokenVersion: user.tokenVersion,
    };

    const userProfile = await this.getProfile(user.id);

    return {
      access_token: this.jwtService.sign(payload),
      user: userProfile,
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email, state: RecordState.ACTIVE } });
    if (!user) {
      // SEC-07: Don't reveal if user exists
      return { message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi (eğer hesap mevcutsa).' };
    }

    // In a real app, send email with token. For now, just logging.
    console.log(`[AUTH] Forgot password requested for ${dto.email}`);
    return { message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi (eğer hesap mevcutsa).' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Mevcut şifre hatalı');

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    user.tokenVersion += 1; // Invalidate current tokens

    await this.userRepo.save(user);
    return { message: 'Şifre başarıyla değiştirildi. Lütfen yeni şifrenizle giriş yapınız.' };
  }
}
