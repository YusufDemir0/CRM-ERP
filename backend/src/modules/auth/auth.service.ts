import { Injectable, UnauthorizedException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
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
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  /**
   * SEC-07: Pre-generated valid bcrypt hash for timing attack prevention.
   * Generated once at startup with the same cost factor (12) as real passwords.
   * This ensures bcrypt.compare() runs with identical computational cost
   * regardless of whether the user exists.
   */
  private dummyHash: string = '';

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

  async onModuleInit(): Promise<void> {
    // Generate a real bcrypt hash with cost factor 12 — same as production passwords
    this.dummyHash = await bcrypt.hash('dummy-password-never-matches-anything', 12);
    this.logger.debug('SEC-07: Timing-attack dummy hash generated');
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
      relations: ['roles'],
    });

    if (!user) {
      // SEC-07: Perform a dummy comparison to normalize response time (prevents username enumeration)
      // Uses a real bcrypt hash generated at startup — guaranteed valid structure.
      await bcrypt.compare(dto.password, this.dummyHash);
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
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    
    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh', tokenVersion: user.tokenVersion },
      { expiresIn: '7d' }
    );

    const refreshSalt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(refresh_token, refreshSalt);
    await this.userRepo.save(user);

    return {
      access_token,
      refresh_token,
      user: userProfile,
    };
  }

  async refreshToken(oldRefreshToken: string) {
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
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newPayload = {
        sub: user.id,
        username: user.username,
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

  async register(dto: RegisterDto) {
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
      return {
        id: savedUser.id,
        username: savedUser.username,
        fullName: savedUser.fullName,
        email: savedUser.email,
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new ConflictException('Bu kullanıcı adı veya email zaten kullanılıyor');
      }
      throw error;
    }
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
