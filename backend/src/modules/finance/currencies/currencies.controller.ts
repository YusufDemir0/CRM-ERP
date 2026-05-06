import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../dto/finance.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  findAll(@Query() query: PaginationDto) { return this.currenciesService.findAll(query); }

  @Get('default')
  getDefault() { return this.currenciesService.getDefault(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.currenciesService.findOne(id); }

  @Post()
  create(@Body() dto: CreateCurrencyDto, @CurrentUser('sub') userId: string) { return this.currenciesService.create(dto, userId); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCurrencyDto, @CurrentUser('sub') userId: string) {
    return this.currenciesService.update(id, dto, userId);
  }

  @Put(':id/default')
  setDefault(@Param('id') id: string) {
    return this.currenciesService.setDefault(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.currenciesService.delete(id);
  }
}
