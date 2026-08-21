import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionsQueryDto, CreateTransferDto } from '../dto/finance.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get()
  @RequirePermissions('FINANCE_VIEW_DEPT', 'FINANCE_VIEW_ALL')
  findAll(@Query() query: TransactionsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.txService.findAll(query, user);
  }

  @Get('status')
  @RequirePermissions('FINANCE_VIEW_DEPT', 'FINANCE_VIEW_ALL')
  getStatus() {
    return this.txService.getStatus();
  }

  @Get('trends')
  @RequirePermissions('FINANCE_VIEW_DEPT', 'FINANCE_VIEW_ALL')
  getDailyTrends() {
    return this.txService.getDailyTrends();
  }

  @Get(':id')
  @RequirePermissions('FINANCE_VIEW_DEPT', 'FINANCE_VIEW_ALL')
  findOne(@Param('id') id: string) { 
    return this.txService.findOne(id); 
  }

  @Post()
  @RequirePermissions('FINANCE_RECEIVE_PAYMENT', 'FINANCE_MAKE_PAYMENT')
  create(@Body() dto: CreateTransactionDto, @CurrentUser() user: JwtPayload) {
    const isSystemAdmin = user.isSystemAdmin;
    const permissions = user.permissions || [];
    if (!isSystemAdmin) {
      if (dto.type === 'in' && !permissions.includes('FINANCE_RECEIVE_PAYMENT')) {
        throw new ForbiddenException('Tahsilat almak için yetkiniz bulunmamaktadır.');
      }
      if (dto.type === 'out' && !permissions.includes('FINANCE_MAKE_PAYMENT')) {
        throw new ForbiddenException('Ödeme yapmak için yetkiniz bulunmamaktadır.');
      }
    }
    return this.txService.create(dto, String(user.sub));
  }

  @Post('transfer')
  @RequirePermissions('FINANCE_TRANSFER')
  transfer(@Body() dto: CreateTransferDto, @CurrentUser('sub') userId: string) {
    return this.txService.transfer(dto, userId);
  }

  @Post(':id/cancel')
  @RequirePermissions('FINANCE_RECONCILE')
  cancel(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.txService.cancel(id, userId);
  }
}