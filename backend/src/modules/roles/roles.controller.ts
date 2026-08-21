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
  @RequirePermissions('ROLES_VIEW_ALL')
  findAllRoles(@Query() query: PaginationDto) {
    return this.rolesService.findAllRoles(query);
  }

  @Get('status')
  @RequirePermissions('ROLES_VIEW_ALL')
  getStatus() {
    return this.rolesService.getStatus();
  }

  @Post()
  @RequirePermissions('ROLES_CREATE')
  createRole(@Body() dto: CreateRoleDto, @CurrentUser('sub') userId: string) {
    return this.rolesService.createRole(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('ROLES_EDIT')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @CurrentUser('sub') userId: string) {
    return this.rolesService.updateRole(id, dto, userId);
  }

  // ────── PERMISSIONS ──────
  @Get('permissions/all')
  @RequirePermissions('ROLES_VIEW_ALL')
  findAllPermissions(@Query() query: PaginationDto) {
    return this.rolesService.findAllPermissions(query);
  }

  @Post('permissions')
  @RequirePermissions('ROLES_CREATE')
  createPermission(@Body() dto: CreatePermissionDto, @CurrentUser('sub') userId: string) {
    return this.rolesService.createPermission(dto, userId);
  }

  // ────── USER ROLE ASSIGNMENT ──────
  @Post('assign')
  @RequirePermissions('ROLES_ASSIGN')
  assignRole(@Body() dto: AssignRoleDto) {
    return this.rolesService.assignRole(dto);
  }

  @Delete('assign')
  @RequirePermissions('ROLES_ASSIGN')
  removeRole(@Body() dto: AssignRoleDto) {
    return this.rolesService.removeRole(dto);
  }



  // ────── WILDCARDS (Place at bottom to avoid route clashes) ──────
  @Get(':id')
  @RequirePermissions('ROLES_VIEW_ALL')
  findOneRole(@Param('id') id: string) {
    return this.rolesService.findOneRole(id);
  }

  @Delete(':id')
  @RequirePermissions('ROLES_DELETE')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }
}
