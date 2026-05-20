import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { SetUserPermissionDto, RemoveUserPermissionDto } from './dto/role.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('user-permissions')
export class UserPermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions('PERMISSION_ASSIGN')
  setUserPermission(@Body() dto: SetUserPermissionDto, @CurrentUser('sub') userId: string) {
    return this.rolesService.setUserPermission(dto, userId);
  }

  @Get(':userId')
  @RequirePermissions('PERMISSION_VIEW')
  getUserPermissions(@Param('userId') userId: string) {
    return this.rolesService.getUserPermissions(userId);
  }

  @Delete()
  @RequirePermissions('PERMISSION_ASSIGN')
  removeUserPermission(@Body() dto: RemoveUserPermissionDto) {
    return this.rolesService.removeUserPermission(dto);
  }
}
