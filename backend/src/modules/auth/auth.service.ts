import { Injectable, UnauthorizedException, ConflictException, OnModuleInit, Logger, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserProfile } from './interfaces/user-profile.interface';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { LoginDto, RegisterDto, ForgotPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { RecordState } from '../../common/enums/record-state.enum';
import { SystemLog } from '../logs/entities/log.entity';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);



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

  onModuleInit(): void {
  }

  async login(dto: LoginDto, ipAddress?: string | null): Promise<{ access_token: string; refresh_token: string; user: UserProfile }> {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('Böyle bir kullanıcı bulunmamaktadır. Lütfen YETKİLİ ile iletişime geçiniz.');
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
      throw new UnauthorizedException('Hatalı şifre girişi yaptınız. Lütfen tekrar deneyiniz.');
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
      fullName: user.fullName,
      departmentId: user.departmentId,
      tokenVersion: user.tokenVersion,
    };

    const userProfile = await this.getProfile(String(user.id));
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });

    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh', tokenVersion: user.tokenVersion },
      { expiresIn: '7d' }
    );

    const refreshSalt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(refresh_token, refreshSalt);
    await this.userRepo.save(user);

    // Save LOGIN system audit log to DB
    try {
      await this.userRepo.manager.insert(SystemLog, {
        userId: String(user.id),
        username: user.username,
        fullName: user.fullName,
        action: 'LOGIN',
        module: 'auth',
        tag: 'SUCCESS',
        details: `${user.fullName} (${user.username}) sisteme başarılı bir şekilde giriş yaptı.`,
        ipAddress: ipAddress || undefined,
      });
    } catch (e) {
      this.logger.error(`Failed to write LOGIN audit log: ${e.message}`);
    }

    return {
      access_token,
      refresh_token,
      user: userProfile,
    };
  }

  async refreshToken(oldRefreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    if (!oldRefreshToken) throw new UnauthorizedException('Refresh token is missing');

    try {
      const payload = this.jwtService.verify(oldRefreshToken, { ignoreExpiration: false });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || user.state !== 1) {
        throw new UnauthorizedException('User not found or disabled');
      }

      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Token version mismatch');
      }

      const isMatch = await bcrypt.compare(oldRefreshToken, user.refreshTokenHash || '');
      if (!isMatch) {
        user.refreshTokenHash = null;
        user.tokenVersion += 1;
        await this.userRepo.save(user);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newPayload = {
        sub: user.id,
        username: user.username,
        fullName: user.fullName,
        departmentId: user.departmentId,
        tokenVersion: user.tokenVersion,
      };

      const access_token = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      const refresh_token = this.jwtService.sign(
        { sub: user.id, type: 'refresh', tokenVersion: user.tokenVersion },
        { expiresIn: '7d' }
      );

      const salt = await bcrypt.genSalt(10);
      user.refreshTokenHash = await bcrypt.hash(refresh_token, salt);
      await this.userRepo.save(user);

      return { access_token, refresh_token };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async register(dto: RegisterDto): Promise<{ id: string; username: string; fullName: string; email: string }> {
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

    try {
      const savedUser = await this.userRepo.save(user);

      // Default role assignment: Role ID 2 (Kullanıcı / Standard User)
      const defaultRole = await this.userRepo.manager.findOne(Role, { where: { id: '2' } });
      if (defaultRole) {
        await this.userRepo.manager.insert(UserRole, {
          userId: savedUser.id,
          roleId: defaultRole.id,
        });
      }

      return {
        id: savedUser.id,
        username: savedUser.username,
        fullName: savedUser.fullName,
        email: savedUser.email,
      };
    } catch (error: unknown) {
      const err = error as { code?: string; errno?: number };
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        throw new ConflictException('Bu kullanıcı adı veya email zaten kullanılıyor');
      }
      throw error;
    }
  }

  async getProfile(userId: string | string): Promise<UserProfile> {
    const user = await this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('user.userPermissions', 'userPerm')
      .leftJoinAndSelect('userPerm.permission', 'userPermData')
      .select([
        'user.id',
        'user.username',
        'user.fullName',
        'user.email',
        'user.phone',
        'user.departmentId',
        'user.state',
        'department.id',
        'department.name',
        'department.cityId',
        'department.commercialAccountId',
        'role.id',
        'role.name',
        'permission.id',
        'permission.key',
        'permission.name',
        'permission.module',
        'userPerm.userId',
        'userPerm.scopeType',
        'userPerm.effect',
        'userPerm.permissionId',
        'userPermData.id',
        'userPermData.key',
        'userPermData.name'
      ])
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');

    const rolePermissions = user.roles?.flatMap(r => r.permissions?.map(p => p.key) || []) || [];
    const userAllowKeys = user.userPermissions?.filter(up => up.effect === 'allow').map(up => up.permission?.key) || [];
    const userDenyKeys = user.userPermissions?.filter(up => up.effect === 'deny').map(up => up.permission?.key) || [];

    const finalPermissions = Array.from(new Set([...rolePermissions, ...userAllowKeys]))
      .filter(key => key && !userDenyKeys.includes(key)) as string[];

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      departmentId: user.departmentId,
      department: user.department,
      roles: user.roles?.map(r => ({ id: r.id, name: r.name })) || [],
      permissions: finalPermissions
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email, state: RecordState.ACTIVE } });
    if (user) {
      this.logger.warn(`Password reset requested for ${dto.email} — email delivery infrastructure pending`);
    }
    return {
      message: 'Eğer girdiğiniz e-posta adresi sistemimizde kayıtlı ise, şifre sıfırlama talimatları iletilecektir. Lütfen yöneticinizle iletişime geçiniz.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: String(userId) } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Mevcut şifre hatalı');

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    user.tokenVersion += 1; // Invalidate current tokens

    await this.userRepo.save(user);
    return { message: 'Şifre başarıyla değiştirildi. Lütfen yeni şifrenizle giriş yapınız.' };
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload | null;
    } catch {
      return null;
    }
  }

  async logout(userId: string, username: string, fullName: string, ipAddress?: string | null): Promise<void> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user) {
        user.refreshTokenHash = null;
        await this.userRepo.save(user);
      }

      await this.userRepo.manager.insert(SystemLog, {
        userId,
        username,
        fullName,
        action: 'LOGOUT',
        module: 'auth',
        tag: 'SUCCESS',
        details: `${fullName} (${username}) sistemden güvenli bir şekilde çıkış yaptı.`,
        ipAddress: ipAddress || undefined,
      });
    } catch (e) {
      this.logger.error(`Failed to write LOGOUT audit log or invalidate token: ${e.message}`);
    }
  }
}
