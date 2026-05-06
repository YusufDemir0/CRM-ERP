import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('USER_VIEW')
  findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Get('status')
  @RequirePermissions('USER_VIEW')
  getStatus() {
    return this.usersService.getStatus();
  }

  @Get(':id')
  @RequirePermissions('USER_VIEW')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('USER_CREATE')
  create(@Body() dto: CreateUserDto, @CurrentUser('sub') userId: string) {
    return this.usersService.create(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('USER_EDIT')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.usersService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('USER_DELETE')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.usersService.softDelete(id, userId);
  }
}
