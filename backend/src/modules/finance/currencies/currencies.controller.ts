import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../dto/finance.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @RequirePermissions('FINANCE_VIEW', 'FINANCE_MANAGE', 'SALES_CREATE', 'SALES_VIEW', 'INVENTORY_VIEW', 'CUSTOMER_VIEW')
  findAll(@Query() query: PaginationDto) { return this.currenciesService.findAll(query); }

  @Get('default')
  @RequirePermissions('FINANCE_VIEW', 'FINANCE_MANAGE', 'SALES_CREATE', 'SALES_VIEW', 'INVENTORY_VIEW', 'CUSTOMER_VIEW')
  getDefault() { return this.currenciesService.getDefault(); }

  @Get(':id')
  @RequirePermissions('FINANCE_VIEW', 'FINANCE_MANAGE', 'SALES_CREATE', 'SALES_VIEW', 'INVENTORY_VIEW', 'CUSTOMER_VIEW')
  findOne(@Param('id') id: string) { return this.currenciesService.findOne(id); }

  @Post()
  @RequirePermissions('SYSTEM_EDIT_CURRENCY')
  create(@Body() dto: CreateCurrencyDto, @CurrentUser('sub') userId: string) { return this.currenciesService.create(dto, userId); }

  @Put(':id')
  @RequirePermissions('SYSTEM_EDIT_CURRENCY')
  update(@Param('id') id: string, @Body() dto: UpdateCurrencyDto, @CurrentUser('sub') userId: string) {
    return this.currenciesService.update(id, dto, userId);
  }

  @Put(':id/default')
  @RequirePermissions('SYSTEM_EDIT_CURRENCY')
  setDefault(@Param('id') id: string) {
    return this.currenciesService.setDefault(id);
  }

  @Delete(':id')
  @RequirePermissions('SYSTEM_EDIT_CURRENCY')
  remove(@Param('id') id: string) {
    return this.currenciesService.delete(id);
  }
}
