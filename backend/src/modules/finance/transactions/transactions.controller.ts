import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionsQueryDto } from '../dto/finance.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get()
  @RequirePermissions('FINANCE_VIEW')
  findAll(@Query() query: TransactionsQueryDto) {
    return this.txService.findAll(query);
  }

  @Get('status')
  @RequirePermissions('FINANCE_VIEW')
  getStatus() {
    return this.txService.getStatus();
  }

  @Get('trends')
  @RequirePermissions('FINANCE_VIEW')
  getDailyTrends() {
    return this.txService.getDailyTrends();
  }

  @Get(':id')
  @RequirePermissions('FINANCE_VIEW')
  findOne(@Param('id') id: string) { 
    return this.txService.findOne(id); 
  }

  @Post()
  @RequirePermissions('FINANCE_MANAGE')
  create(@Body() dto: CreateTransactionDto, @CurrentUser('sub') userId: string) {
    return this.txService.create(dto, userId);
  }

  @Post(':id/cancel')
  @RequirePermissions('FINANCE_MANAGE')
  cancel(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.txService.cancel(id, userId);
  }
}