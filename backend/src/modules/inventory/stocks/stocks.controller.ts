import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StocksService } from './stocks.service';
import { StockAdjustmentDto, StocksQueryDto, TransferStockDto } from '../dto/inventory.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @RequirePermissions('INVENTORY_VIEW')
  findAll(@Query() query: StocksQueryDto) {
    return this.stocksService.findAll(query);
  }

  @Get('critical')
  @RequirePermissions('INVENTORY_VIEW')
  getCriticalStocks() { return this.stocksService.getCriticalStocks(); }

  @Get(':id/movements')
  @RequirePermissions('INVENTORY_VIEW')
  getMovements(@Param('id', ParseIntPipe) id: number, @Query() query: PaginationDto) {
    return this.stocksService.getMovements(id, query);
  }

  @Post('adjust')
  @RequirePermissions('INVENTORY_EDIT')
  adjustStock(@Body() dto: StockAdjustmentDto, @CurrentUser('sub') userId: number) {
    return this.stocksService.adjustStock(dto, userId);
  }

  // YENİ EKLENEN ENDPOINT
  @Post('transfer')
  @RequirePermissions('INVENTORY_EDIT')
  transferStock(@Body() dto: TransferStockDto, @CurrentUser('sub') userId: number) {
    return this.stocksService.transferStock(dto, userId);
  }

  @Get('status')
  @RequirePermissions('INVENTORY_VIEW')
  getStatus() { return this.stocksService.getStatus(); }
}