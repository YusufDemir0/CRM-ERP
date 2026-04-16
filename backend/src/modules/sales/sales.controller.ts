import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, CreateSaleTypeDto, ApproveSaleDto, SalesQueryDto, ShipSaleDto } from './dto/sale.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('sales')
@UseGuards(AuthGuard('jwt'))
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ────── SALE TYPES ──────
  @Get('types')
  findAllSaleTypes() { return this.salesService.findAllSaleTypes(); }

  @Post('types')
  @RequirePermissions('satis_olusturma')
  createSaleType(@Body() dto: CreateSaleTypeDto, @CurrentUser('sub') userId: number) {
    return this.salesService.createSaleType(dto, userId);
  }

  @Get('status')
  @RequirePermissions('satis_goruntuleme')
  getStatus() {
    return this.salesService.getStatus();
  }

  // ────── SALES ──────
  @Get()
  @RequirePermissions('satis_goruntuleme')
  findAll(@Query() query: SalesQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('satis_goruntuleme')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Post()
  @RequirePermissions('satis_olusturma')
  create(@Body() dto: CreateSaleDto, @CurrentUser('sub') userId: number) {
    return this.salesService.create(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('satis_duzenleme')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSaleDto, @CurrentUser('sub') userId: number) {
    return this.salesService.update(id, dto, userId);
  }

  /**
   * SALE APPROVAL — Kritik endpoint
   * Bu endpoint çağrıldığında stok düşer, bakiye güncellenir.
   * Tümü tek transaction içinde.
   */
  @Post(':id/approve')
  @RequirePermissions('satis_onaylama')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveSaleDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.salesService.approveSale(id, dto, userId);
  }

  @Post(':id/cancel')
  @RequirePermissions('satis_iptal')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.salesService.cancelSale(id, userId);
  }

  @Post(':id/ship')
  @RequirePermissions('satis_onaylama') // Reuse approval permission or add 'satis_sevk'
  ship(@Param('id', ParseIntPipe) id: number, @Body() dto: ShipSaleDto, @CurrentUser('sub') userId: number) {
    return this.salesService.shipSale(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('satis_silme')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.softDelete(id);
  }
}
