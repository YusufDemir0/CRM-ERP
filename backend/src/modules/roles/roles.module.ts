import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { UserPermissionsController } from './user-permissions.controller';
import { RolesService } from './roles.service';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { UserRole } from '../auth/entities/user-role.entity';
import { UserPermission } from '../auth/entities/user-permission.entity';
import { RolePermission } from '../auth/entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, UserRole, UserPermission, RolePermission])],
  controllers: [RolesController, UserPermissionsController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
