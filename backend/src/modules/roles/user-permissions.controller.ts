import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { SetUserPermissionDto, RemoveUserPermissionDto } from './dto/role.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('user-permissions')
export class UserPermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions('USERS_OVERRIDE_PERM')
  setUserPermission(@Body() dto: SetUserPermissionDto, @CurrentUser('sub') userId: string) {
    return this.rolesService.setUserPermission(dto, userId);
  }

  @Get(':userId')
  @RequirePermissions('USERS_OVERRIDE_PERM')
  getUserPermissions(@Param('userId') userId: string) {
    return this.rolesService.getUserPermissions(userId);
  }

  @Delete()
  @RequirePermissions('USERS_OVERRIDE_PERM')
  removeUserPermission(@Body() dto: RemoveUserPermissionDto) {
    return this.rolesService.removeUserPermission(dto);
  }
}
