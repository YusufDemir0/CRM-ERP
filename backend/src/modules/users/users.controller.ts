import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('USERS_VIEW_DEPT', 'USERS_VIEW_ALL')
  findAll(@Query() query: PaginationDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(query, user);
  }

  @Get('status')
  @RequirePermissions('USERS_VIEW_DEPT', 'USERS_VIEW_ALL')
  getStatus() {
    return this.usersService.getStatus();
  }

  @Get(':id')
  @RequirePermissions('USERS_VIEW_DEPT', 'USERS_VIEW_ALL')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(id, user);
  }

  @Post()
  @RequirePermissions('USERS_CREATE')
  create(@Body() dto: CreateUserDto, @CurrentUser('sub') userId: string) {
    return this.usersService.create(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('USERS_EDIT', 'USERS_RESET_PASSWORD', 'USERS_CHANGE_DEPARTMENT', 'USERS_LOCK_ACCOUNT')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const isSystemAdmin = user.isSystemAdmin;
    const permissions = user.permissions || [];
    if (!isSystemAdmin) {
      if (dto.password !== undefined && !permissions.includes('USERS_RESET_PASSWORD')) {
        throw new ForbiddenException('Kullanıcı şifre sıfırlama işlemi için yetkiniz bulunmamaktadır.');
      }
      if (dto.departmentId !== undefined && !permissions.includes('USERS_CHANGE_DEPARTMENT')) {
        throw new ForbiddenException('Kullanıcı departman değiştirme işlemi için yetkiniz bulunmamaktadır.');
      }
      if (dto.state !== undefined && !permissions.includes('USERS_LOCK_ACCOUNT')) {
        throw new ForbiddenException('Kullanıcı hesabı kilitleme/engelleme işlemi için yetkiniz bulunmamaktadır.');
      }
    }
    return this.usersService.update(id, dto, String(user.sub));
  }

  @Delete(':id')
  @RequirePermissions('USERS_DELETE')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.usersService.softDelete(id, userId);
  }
}
