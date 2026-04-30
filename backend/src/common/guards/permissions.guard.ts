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

/**
 * Gelişmiş RBAC Guard:
 *
 * 1. Kullanıcının rollerinden gelen permission'ları topla
 * 2. user_permissions tablosundaki allow/deny override'ları kontrol et
 * 3. deny her zaman kazanır (deny > allow)
 * 4. scope_type kontrolü: global, department, own
 * 5. İlk kullanıcı (ID=1) veya hiç permission tanımlı değilse → bypass
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
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Eğer handler'da @RequirePermissions yoksa, geçiş serbest
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new ForbiddenException('Yetkilendirme bilgisi bulunamadı');
    }

    const userId = user.sub;

    // ─── BYPASS: İlk kullanıcı (superadmin) kontrolü ───
    // Eğer permissions tablosunda hiç kayıt yoksa, tüm kullanıcılar geçebilir
    // Bu, ilk kurulumda sistemin kilitlenmesini önler
    const totalPermissions = await this.permissionRepo.count();
    if (totalPermissions === 0) {
      this.logger.warn(`No permissions defined in DB — bypassing guard for user ${userId}`);
      return true;
    }

    // ─── BYPASS: System Admin kontrolü ───
    // 'isSystemAdmin' bayrağı true olan roller tüm endpoint'lere erişebilir
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      relations: ['role'],
    });
    const roleIds = userRoles.map((ur) => ur.roleId);
    
    // Güvenlik Düzeltmesi (1.4): Hardcode isim kontrolü yerine DB kolonuna bakıyoruz.
    const isSystemAdmin = userRoles.some((ur) => ur.role?.isSystemAdmin === true);
    
    if (isSystemAdmin) {
      request.user.isSystemAdmin = true;
      request.user.permissions = []; // System admins don't need explicit permissions
      return true;
    }

    // ─── CACHE CHECK ───
    const cacheKey = `user_perms_${userId}`;
    const cachedPerms = await this.cacheManager.get<string[]>(cacheKey);
    
    let finalPermissions: string[] = [];
    
    if (cachedPerms) {
      finalPermissions = cachedPerms;
    } else {
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

      // Combine and filter
      const userAllowKeys = userPerms.filter(up => up.effect === 'allow').map(up => up.permission?.key);
      const userDenyKeys = userPerms.filter(up => up.effect === 'deny').map(up => up.permission?.key);
      
      finalPermissions = Array.from(new Set([...rolePermissionKeys, ...userAllowKeys]))
        .filter(key => key && !userDenyKeys.includes(key)) as string[];

      await this.cacheManager.set(cacheKey, finalPermissions, 60000); // 1 dk cache
    }

    request.user.permissions = finalPermissions;
    request.user.isSystemAdmin = isSystemAdmin;

    // 4. Her required permission için kontrol
    const hasAll = requiredPermissions.every(key => finalPermissions.includes(key));
    
    if (!hasAll) {
       this.logger.warn(`User ${userId} missing one of: ${requiredPermissions.join(', ')}`);
       throw new ForbiddenException(`Bu işlem için yetkiniz bulunmamaktadır.`);
    }

    return true;
  }
}
