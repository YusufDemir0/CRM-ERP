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
  @RequirePermissions('kullanici_goruntuleme')
  findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Get('status')
  @RequirePermissions('kullanici_goruntuleme')
  getStatus() {
    return this.usersService.getStatus();
  }

  @Get(':id')
  @RequirePermissions('kullanici_goruntuleme')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('kullanici_olusturma')
  create(@Body() dto: CreateUserDto, @CurrentUser('sub') userId: number) {
    return this.usersService.create(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('kullanici_duzenleme')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.usersService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('kullanici_silme')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.usersService.softDelete(id, userId);
  }
}
