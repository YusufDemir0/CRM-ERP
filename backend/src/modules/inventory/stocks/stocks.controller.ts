import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StocksService } from './stocks.service';
import { StockAdjustmentDto, StocksQueryDto } from '../dto/inventory.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('stocks')
@UseGuards(AuthGuard('jwt'))
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @RequirePermissions('stok_goruntuleme')
  findAll(@Query() query: StocksQueryDto) {
    return this.stocksService.findAll(query);
  }

  @Get('critical')
  @RequirePermissions('stok_goruntuleme')
  getCriticalStocks() { return this.stocksService.getCriticalStocks(); }

  @Get(':id/movements')
  @RequirePermissions('stok_goruntuleme')
  getMovements(@Param('id', ParseIntPipe) id: number, @Query() query: PaginationDto) {
    return this.stocksService.getMovements(id, query);
  }

  @Post('adjust')
  @RequirePermissions('stok_duzenleme')
  adjustStock(@Body() dto: StockAdjustmentDto, @CurrentUser('sub') userId: number) {
    return this.stocksService.adjustStock(dto, userId);
  }
}
