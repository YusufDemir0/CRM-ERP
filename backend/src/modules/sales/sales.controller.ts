import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, CreateSaleTypeDto, ApproveSaleDto, SalesQueryDto, ShipSaleDto } from './dto/sale.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ────── SALE TYPES ──────
  @Get('types')
  findAllSaleTypes() { return this.salesService.findAllSaleTypes(); }

  @Post('types')
  @RequirePermissions('SALES_CREATE')
  createSaleType(@Body() dto: CreateSaleTypeDto, @CurrentUser('sub') userId: number) {
    return this.salesService.createSaleType(dto, userId);
  }

  @Get('status')
  @RequirePermissions('SALES_VIEW')
  getStatus() {
    return this.salesService.getStatus();
  }

  // ────── SALES ──────
  @Get('export')
  @RequirePermissions('SALES_VIEW')
  export(@Query() query: SalesQueryDto, @CurrentUser() user: JwtPayload, @Res() res: Response) {
    return this.salesService.exportToExcel(query, user, res);
  }

  @Get()
  @RequirePermissions('SALES_VIEW')
  findAll(@Query() query: SalesQueryDto, @CurrentUser() user: JwtPayload) {
    return this.salesService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('SALES_VIEW')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Post()
  @RequirePermissions('SALES_CREATE')
  create(@Body() dto: CreateSaleDto, @CurrentUser('sub') userId: number) {
    return this.salesService.create(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('SALES_EDIT')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSaleDto, @CurrentUser('sub') userId: number) {
    return this.salesService.update(id, dto, userId);
  }

  /**
   * SALE APPROVAL — Kritik endpoint
   * Bu endpoint çağrıldığında stok düşer, bakiye güncellenir.
   * Tümü tek transaction içinde.
   */
  @Post(':id/approve')
  @RequirePermissions('SALES_APPROVE')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveSaleDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.salesService.approveSale(id, dto, userId);
  }

  @Post(':id/cancel')
  @RequirePermissions('SALES_CANCEL')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.salesService.cancelSale(id, userId);
  }

  @Post(':id/ship')
  @RequirePermissions('SALES_APPROVE') // Reuse approval permission or add 'satis_sevk'
  ship(@Param('id', ParseIntPipe) id: number, @Body() dto: ShipSaleDto, @CurrentUser('sub') userId: number) {
    return this.salesService.shipSale(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('SALES_DELETE')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.softDelete(id);
  }
}
