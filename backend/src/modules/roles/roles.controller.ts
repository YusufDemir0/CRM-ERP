import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, AssignRoleDto, SetUserPermissionDto } from './dto/role.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ────── ROLES ──────
  @Get()
  @RequirePermissions('rol_goruntuleme')
  findAllRoles(@Query() query: PaginationDto) {
    return this.rolesService.findAllRoles(query);
  }

  @Get('status')
  @RequirePermissions('rol_goruntuleme')
  getStatus() {
    return this.rolesService.getStatus();
  }

  @Get(':id')
  @RequirePermissions('rol_goruntuleme')
  findOneRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOneRole(id);
  }

  @Post()
  @RequirePermissions('rol_olusturma')
  createRole(@Body() dto: CreateRoleDto, @CurrentUser('sub') userId: number) {
    return this.rolesService.createRole(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('rol_duzenleme')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto, @CurrentUser('sub') userId: number) {
    return this.rolesService.updateRole(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('rol_silme')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }

  // ────── PERMISSIONS ──────
  @Get('permissions/all')
  @RequirePermissions('rol_goruntuleme')
  findAllPermissions(@Query() query: PaginationDto) {
    return this.rolesService.findAllPermissions(query);
  }

  @Post('permissions')
  @RequirePermissions('rol_olusturma')
  createPermission(@Body() dto: CreatePermissionDto, @CurrentUser('sub') userId: number) {
    return this.rolesService.createPermission(dto, userId);
  }

  // ────── USER ROLE ASSIGNMENT ──────
  @Post('assign')
  @RequirePermissions('rol_atama')
  assignRole(@Body() dto: AssignRoleDto) {
    return this.rolesService.assignRole(dto);
  }

  @Delete('assign')
  @RequirePermissions('rol_atama')
  removeRole(@Body() dto: AssignRoleDto) {
    return this.rolesService.removeRole(dto);
  }

  // ────── USER PERMISSION OVERRIDE ──────
  @Post('user-permissions')
  @RequirePermissions('yetki_atama')
  setUserPermission(@Body() dto: SetUserPermissionDto, @CurrentUser('sub') userId: number) {
    return this.rolesService.setUserPermission(dto, userId);
  }

  @Get('user-permissions/:userId')
  @RequirePermissions('yetki_goruntuleme')
  getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.rolesService.getUserPermissions(userId);
  }
}
