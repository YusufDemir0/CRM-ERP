import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionsQueryDto } from '../dto/finance.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get()
  @RequirePermissions('finans_goruntuleme')
  findAll(@Query() query: TransactionsQueryDto) {
    return this.txService.findAll(query);
  }

  @Get('status')
  @RequirePermissions('finans_goruntuleme')
  getStatus() {
    return this.txService.getStatus();
  }

  @Get('trends')
  @RequirePermissions('finans_goruntuleme')
  getDailyTrends() {
    return this.txService.getDailyTrends();
  }

  @Get(':id')
  @RequirePermissions('finans_goruntuleme')
  findOne(@Param('id', ParseIntPipe) id: number) { 
    return this.txService.findOne(id); 
  }

  @Post()
  @RequirePermissions('finans_islem')
  create(@Body() dto: CreateTransactionDto, @CurrentUser('sub') userId: number) {
    return this.txService.create(dto, userId);
  }

  @Post(':id/cancel')
  @RequirePermissions('finans_islem')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.txService.cancel(id, userId);
  }
}