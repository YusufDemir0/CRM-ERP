import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from '../dto/finance.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
export class AccountsController {
  constructor(private readonly accService: AccountsService) {}

  @Get()
  findAll(@Query() query: PaginationDto) { return this.accService.findAll(query); }

  @Get('status')
  getStatus() { return this.accService.getStatus(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.accService.findOne(id); }

  @Post()
  create(@Body() dto: CreateAccountDto, @CurrentUser('sub') userId: number) { return this.accService.create(dto, userId); }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAccountDto, @CurrentUser('sub') userId: number) {
    return this.accService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.accService.softDelete(id); }
}
