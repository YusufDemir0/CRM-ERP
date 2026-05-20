import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, AssignRoleDto, SetUserPermissionDto, RemoveUserPermissionDto } from './dto/role.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ────── ROLES ──────
  @Get()
  @RequirePermissions('ROLE_VIEW')
  findAllRoles(@Query() query: PaginationDto) {
    return this.rolesService.findAllRoles(query);
  }

  @Get('status')
  @RequirePermissions('ROLE_VIEW')
  getStatus() {
    return this.rolesService.getStatus();
  }

  @Get(':id')
  @RequirePermissions('ROLE_VIEW')
  findOneRole(@Param('id') id: string) {
    return this.rolesService.findOneRole(id);
  }

  @Post()
  @RequirePermissions('ROLE_CREATE')
  createRole(@Body() dto: CreateRoleDto, @CurrentUser('sub') userId: string) {
    return this.rolesService.createRole(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('ROLE_EDIT')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @CurrentUser('sub') userId: string) {
    return this.rolesService.updateRole(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('ROLE_DELETE')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  // ────── PERMISSIONS ──────
  @Get('permissions/all')
  @RequirePermissions('ROLE_VIEW')
  findAllPermissions(@Query() query: PaginationDto) {
    return this.rolesService.findAllPermissions(query);
  }

  @Post('permissions')
  @RequirePermissions('ROLE_CREATE')
  createPermission(@Body() dto: CreatePermissionDto, @CurrentUser('sub') userId: string) {
    return this.rolesService.createPermission(dto, userId);
  }

  // ────── USER ROLE ASSIGNMENT ──────
  @Post('assign')
  @RequirePermissions('ROLE_ASSIGN')
  assignRole(@Body() dto: AssignRoleDto) {
    return this.rolesService.assignRole(dto);
  }

  @Delete('assign')
  @RequirePermissions('ROLE_ASSIGN')
  removeRole(@Body() dto: AssignRoleDto) {
    return this.rolesService.removeRole(dto);
  }

  // ────── USER PERMISSION OVERRIDE ──────
  @Post('user-permissions')
  @RequirePermissions('PERMISSION_ASSIGN')
  setUserPermission(@Body() dto: SetUserPermissionDto, @CurrentUser('sub') userId: string) {
    return this.rolesService.setUserPermission(dto, userId);
  }

  @Get('user-permissions/:userId')
  @RequirePermissions('PERMISSION_VIEW')
  getUserPermissions(@Param('userId') userId: string) {
    return this.rolesService.getUserPermissions(userId);
  }

  @Delete('user-permissions')
  @RequirePermissions('PERMISSION_ASSIGN')
  removeUserPermission(@Body() dto: RemoveUserPermissionDto) {
    return this.rolesService.removeUserPermission(dto);
  }
}
