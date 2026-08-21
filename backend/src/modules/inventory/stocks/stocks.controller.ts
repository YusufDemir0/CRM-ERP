import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StocksService } from './stocks.service';
import { StockAdjustmentDto, StocksQueryDto, TransferStockDto } from '../dto/inventory.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @RequirePermissions('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  findAll(@Query() query: StocksQueryDto, @CurrentUser() user: JwtPayload) {
    return this.stocksService.findAll(query, user);
  }

  @Get('critical')
  @RequirePermissions('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  getCriticalStocks(@CurrentUser() user: JwtPayload) { return this.stocksService.getCriticalStocks({}, user); }

  @Get('movements')
  @RequirePermissions('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  findAllMovements(@Query() query: PaginationDto & { type?: string; search?: string }, @CurrentUser() user: JwtPayload) {
    return this.stocksService.findAllMovements(query, user);
  }

  @Get(':id/movements')
  @RequirePermissions('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  getMovements(@Param('id') id: string, @Query() query: PaginationDto, @CurrentUser() user: JwtPayload) {
    return this.stocksService.getMovements(id, query, user);
  }

  @Post('adjust')
  @RequirePermissions('INVENTORY_EDIT')
  adjustStock(@Body() dto: StockAdjustmentDto, @CurrentUser('sub') userId: string) {
    return this.stocksService.adjustStock(dto, userId);
  }

  // YENİ EKLENEN ENDPOINT
  @Post('transfer')
  @RequirePermissions('INVENTORY_EDIT')
  transferStock(@Body() dto: TransferStockDto, @CurrentUser('sub') userId: string) {
    return this.stocksService.transferStock(dto, userId);
  }

  @Get('status')
  @RequirePermissions('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  getStatus(@CurrentUser() user: JwtPayload) { return this.stocksService.getStatus(user); }
}