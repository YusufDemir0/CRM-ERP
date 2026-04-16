import {
  Injectable,
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
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
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
      return true;
    }

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

    // 4. Her required permission için kontrol
    for (const requiredKey of requiredPermissions) {
      // User-level deny kontrolü (deny her zaman kazanır)
      const denyOverride = userPerms.find(
        (up) => up.permission?.key === requiredKey && up.effect === 'deny',
      );
      if (denyOverride) {
        this.logger.warn(
          `User ${userId} denied permission: ${requiredKey} (explicit deny)`,
        );
        throw new ForbiddenException(
          `Bu işlem için yetkiniz bulunmamaktadır: ${requiredKey}`,
        );
      }

      // User-level allow override kontrolü
      const allowOverride = userPerms.find(
        (up) => up.permission?.key === requiredKey && up.effect === 'allow',
      );

      if (allowOverride) {
        // Scope kontrolü metadata'yı request'e ekle
        request.permissionScope = {
          type: allowOverride.scopeType,
          scopeId: allowOverride.scopeId,
        };
        continue; // Bu permission OK
      }

      // Rol bazlı kontrol
      if (!rolePermissionKeys.includes(requiredKey)) {
        this.logger.warn(
          `User ${userId} missing permission: ${requiredKey}`,
        );
        throw new ForbiddenException(
          `Bu işlem için yetkiniz bulunmamaktadır: ${requiredKey}`,
        );
      }
    }

    return true;
  }
}
