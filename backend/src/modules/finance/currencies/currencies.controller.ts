import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../dto/finance.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  findAll() { return this.currenciesService.findAll(); }

  @Get('default')
  getDefault() { return this.currenciesService.getDefault(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.currenciesService.findOne(id); }

  @Post()
  create(@Body() dto: CreateCurrencyDto, @CurrentUser('sub') userId: number) { return this.currenciesService.create(dto, userId); }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCurrencyDto, @CurrentUser('sub') userId: number) {
    return this.currenciesService.update(id, dto, userId);
  }

  @Put(':id/default')
  setDefault(@Param('id', ParseIntPipe) id: number) {
    return this.currenciesService.setDefault(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.currenciesService.delete(id);
  }
}
