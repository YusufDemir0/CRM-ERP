import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, StreamableFile, Header, ForbiddenException } from '@nestjs/common';
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
  createSaleType(@Body() dto: CreateSaleTypeDto, @CurrentUser('sub') userId: string) {
    return this.salesService.createSaleType(dto, userId);
  }

  @Get('status')
  @RequirePermissions('SALES_VIEW_OWN', 'SALES_VIEW_DEPT', 'SALES_VIEW_ALL')
  getStatus() {
    return this.salesService.getStatus();
  }

  // ────── SALES ──────
  @Get('export')
  @RequirePermissions('SALES_VIEW_OWN', 'SALES_VIEW_DEPT', 'SALES_VIEW_ALL')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="Satis_Raporu.xlsx"')
  export(@Query() query: SalesQueryDto, @CurrentUser() user: JwtPayload): Promise<StreamableFile> {
    return this.salesService.exportToExcel(query, user);
  }

  @Get()
  findAll(@Query() query: SalesQueryDto, @CurrentUser() user: JwtPayload) {
    const hasSalesView = user.isSystemAdmin || 
                         user.permissions?.includes('SALES_VIEW_OWN') || 
                         user.permissions?.includes('SALES_VIEW_DEPT') || 
                         user.permissions?.includes('SALES_VIEW_ALL') ||
                         user.permissions?.includes('sales_view_own') || 
                         user.permissions?.includes('sales_view_dept') || 
                         user.permissions?.includes('sales_view_all');
    const hasCustomerView = user.isSystemAdmin || 
                            user.permissions?.includes('PARTIES_VIEW_OWN') || 
                            user.permissions?.includes('PARTIES_VIEW_DEPT') || 
                            user.permissions?.includes('PARTIES_VIEW_ALL') ||
                            user.permissions?.includes('parties_view_own') || 
                            user.permissions?.includes('parties_view_dept') || 
                            user.permissions?.includes('parties_view_all') ||
                            user.permissions?.includes('PARTIES_VIEW_SALES_HISTORY');
    
    if (hasSalesView || (hasCustomerView && query.partyId)) {
      return this.salesService.findAll(query, user);
    }
    
    throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
  }

  @Get('minimal-lookup')
  findMinimalLookup(@CurrentUser() user: JwtPayload) {
    return this.salesService.findMinimalLookup(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const hasSalesView = user.isSystemAdmin || 
                         user.permissions?.includes('SALES_VIEW_OWN') || 
                         user.permissions?.includes('SALES_VIEW_DEPT') || 
                         user.permissions?.includes('SALES_VIEW_ALL') ||
                         user.permissions?.includes('sales_view_own') || 
                         user.permissions?.includes('sales_view_dept') || 
                         user.permissions?.includes('sales_view_all');
    const hasCustomerView = user.isSystemAdmin || 
                            user.permissions?.includes('PARTIES_VIEW_OWN') || 
                            user.permissions?.includes('PARTIES_VIEW_DEPT') || 
                            user.permissions?.includes('PARTIES_VIEW_ALL') ||
                            user.permissions?.includes('parties_view_own') || 
                            user.permissions?.includes('parties_view_dept') || 
                            user.permissions?.includes('parties_view_all') ||
                            user.permissions?.includes('PARTIES_VIEW_SALES_HISTORY');

    if (hasSalesView || hasCustomerView) {
      return this.salesService.findOne(id);
    }

    throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
  }

  @Post()
  @RequirePermissions('SALES_CREATE')
  create(@Body() dto: CreateSaleDto, @CurrentUser('sub') userId: string) {
    return this.salesService.create(dto, userId);
  }

  @Put(':id')
  @RequirePermissions('SALES_EDIT_OWN', 'SALES_EDIT_ALL')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.salesService.update(id, dto, String(user.sub), user);
  }

  /**
   * SALE APPROVAL — Kritik endpoint
   * Bu endpoint çağrıldığında stok düşer, bakiye güncellenir.
   * Tümü tek transaction içinde.
   */
  @Post(':id/approve')
  @RequirePermissions('SALES_APPROVE')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveSaleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.salesService.approveSale(id, dto, String(user.sub), user);
  }

  @Post(':id/cancel')
  @RequirePermissions('SALES_CANCEL')
  cancel(@Param('id') id: string, @Body() dto: { reason: string }, @CurrentUser('sub') userId: string) {
    return this.salesService.cancelSale(id, dto.reason, userId);
  }

  @Post(':id/revert-to-draft')
  @RequirePermissions('SALES_APPROVE')
  revertToDraft(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.salesService.revertToDraft(id, userId);
  }

  @Post(':id/ship')
  @RequirePermissions('SALES_SHIP')
  ship(@Param('id') id: string, @Body() dto: ShipSaleDto, @CurrentUser('sub') userId: string) {
    return this.salesService.shipSale(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('SALES_DELETE_OWN')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.salesService.softDelete(id, String(user.sub), user);
  }
}
