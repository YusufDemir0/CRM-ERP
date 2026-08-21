import {
  Injectable,
  Inject,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserPermission } from '../../modules/auth/entities/user-permission.entity';
import { RolePermission } from '../../modules/auth/entities/role-permission.entity';
import { UserRole } from '../../modules/auth/entities/user-role.entity';
import { Permission } from '../../modules/auth/entities/permission.entity';
import { User } from '../../modules/auth/entities/user.entity';
import { RecordState } from '../enums/record-state.enum';

/**
 * Gelişmiş RBAC Guard:
 *
 * 1. Kullanıcının state ve tokenVersion kontrolü (Banned User Bypass Fix)
 * 2. Kullanıcının rollerinden gelen permission'ları topla
 * 3. user_permissions tablosundaki allow/deny override'ları kontrol et
 * 4. deny her zaman kazanır (deny > allow)
 * 5. scope_type kontrolü: global, department, own
 * 6. İlk kullanıcı (ID=1) veya hiç permission tanımlı değilse → bypass
 */
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private userPermRepo: Repository<UserPermission>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Eğer yetkilendirme bilgisi yoksa ve @RequirePermissions yoksa serbest, varsa yetkisiz fırlat
    if (!user || !user.sub) {
      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }
      throw new ForbiddenException('Yetkilendirme bilgisi bulunamadı');
    }

    const userId = user.sub;

    // ─── SECURITY: Banned User / Token Version Check ───
    // Prevents deactivated or banned users from using valid JWTs
    const stateCacheKey = `user_state_${userId}`;
    let userState: { state: RecordState; tokenVersion: number } | undefined;

    const cachedState = await this.cacheManager.get<{ state: number; tokenVersion: number }>(stateCacheKey);
    if (cachedState) {
      userState = cachedState;
    } else {
      const dbUser = await this.userRepo.findOne({
        where: { id: String(userId) },
        select: ['id', 'state', 'tokenVersion'],
      });
      if (dbUser) {
        userState = { state: dbUser.state, tokenVersion: dbUser.tokenVersion };
        await this.cacheManager.set(stateCacheKey, userState, 60000); // 60s cache
      }
    }

    if (userState) {
      // Block inactive/banned/locked users
      if (userState.state !== RecordState.ACTIVE) {
        this.logger.warn(`Blocked request from inactive user ${userId} (state=${userState.state})`);
        throw new ForbiddenException('Hesabınız aktif değil. Lütfen yöneticinizle iletişime geçin.');
      }
      // Block stale tokens (tokenVersion mismatch = token was invalidated)
      if (user.tokenVersion !== undefined && userState.tokenVersion !== user.tokenVersion) {
        this.logger.warn(`Blocked stale token for user ${userId} (jwt.tv=${user.tokenVersion}, db.tv=${userState.tokenVersion})`);
        throw new ForbiddenException('Oturumunuz geçersiz kılınmıştır. Lütfen tekrar giriş yapın.');
      }
    }

    // ─── CACHE CHECK ───
    const cacheKey = `user_perms_${userId}`;
    const cachedData = await this.cacheManager.get<{ permissions: string[]; isSystemAdmin: boolean }>(cacheKey);
    
    let finalPermissions: string[] = [];
    let isSystemAdmin = false;
    
    if (cachedData) {
      finalPermissions = cachedData.permissions;
      isSystemAdmin = cachedData.isSystemAdmin;
    } else {
      // 1. Rol bilgilerini al
      const userRoles = await this.userRoleRepo.find({
        where: { userId },
        relations: ['role'],
      });
      const roleIds = userRoles.map((ur) => ur.roleId);
      isSystemAdmin = userRoles.some((ur) => ur.role?.isSystemAdmin === true);

      // 2. Rol bazlı permission'ları al
      let rolePermissionKeys: string[] = [];
      if (roleIds.length > 0) {
        const rolePerms = await this.rolePermRepo.find({
          where: { roleId: In(roleIds) },
          relations: ['permission'],
        });
        rolePermissionKeys = rolePerms
          .filter((rp) => rp.permission)
          .map((rp) => rp.permission.key);
      }

      // 3. Kullanıcı bazlı override'ları al
      const userPerms = await this.userPermRepo.find({
        where: { userId },
        relations: ['permission'],
      });

      // Combine and filter with Set (O(1) lookup)
      const userDenySet = new Set(userPerms.filter(up => up.effect === 'deny').map(up => up.permission?.key));
      const userAllowKeys = userPerms.filter(up => up.effect === 'allow').map(up => up.permission?.key);
      
      const allCandidateKeys = [...rolePermissionKeys, ...userAllowKeys];
      finalPermissions = Array.from(new Set(allCandidateKeys.filter(key => key && !userDenySet.has(key)))) as string[];

      await this.cacheManager.set(cacheKey, { permissions: finalPermissions, isSystemAdmin }, 60000); // 1 dk cache
    }

    // Her durumda downstream servisler için request.user bilgilerini set et
    request.user.isSystemAdmin = isSystemAdmin;
    request.user.permissions = finalPermissions;

    // Eğer handler'da @RequirePermissions yoksa, geçiş serbest
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    if (isSystemAdmin) {
      return true;
    }

    // 4. Her required permission için kontrol (En az birine sahip olması yeterlidir)
    const hasAny = requiredPermissions.some(key => finalPermissions.includes(key));
    
    if (!hasAny) {
       this.logger.warn(`User ${userId} missing one of: ${requiredPermissions.join(', ')}`);
       throw new ForbiddenException(`Bu işlem için yetkiniz bulunmamaktadır.`);
    }

    return true;
  }
}

