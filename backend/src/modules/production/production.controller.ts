import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductionService } from './production.service';
import {
  CreateBomDto, UpdateBomDto,
  CreateProductionOrderDto, UpdateProductionOrderDto,
  BomQueryDto, ProductionOrderQueryDto,
} from './dto/production.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('production')
export class ProductionController {
  constructor(private readonly prodService: ProductionService) {}

  // ────── BOMs (Reçeteler) ──────
  @Get('boms')
  @RequirePermissions('PRODUCTION_VIEW')
  findAllBoms(@Query() query: BomQueryDto) { return this.prodService.findAllBoms(query); }

  @Get('boms/:id')
  @RequirePermissions('PRODUCTION_VIEW')
  findOneBom(@Param('id') id: string) { return this.prodService.findOneBom(id); }

  @Post('boms')
  @RequirePermissions('PRODUCTION_CREATE')
  createBom(@Body() dto: CreateBomDto, @CurrentUser('sub') userId: string) { 
    return this.prodService.createBom(dto, userId); 
  }

  @Put('boms/:id')
  @RequirePermissions('PRODUCTION_EDIT')
  updateBom(@Param('id') id: string, @Body() dto: UpdateBomDto, @CurrentUser('sub') userId: string) {
    return this.prodService.updateBom(id, dto, userId);
  }

  @Delete('boms/:id')
  @RequirePermissions('PRODUCTION_DELETE')
  deleteBom(@Param('id') id: string) { return this.prodService.deleteBom(id); }

  // ────── PRODUCTION ORDERS (Üretim Emirleri) ──────
  @Get('orders')
  @RequirePermissions('PRODUCTION_VIEW')
  findAllOrders(@Query() query: ProductionOrderQueryDto) { return this.prodService.findAllOrders(query); }

  @Get('orders/:id')
  @RequirePermissions('PRODUCTION_VIEW')
  findOneOrder(@Param('id') id: string) { return this.prodService.findOneOrder(id); }

  @Post('orders')
  @RequirePermissions('PRODUCTION_CREATE')
  createOrder(@Body() dto: CreateProductionOrderDto, @CurrentUser('sub') userId: string) {
    return this.prodService.createOrder(dto, userId);
  }

  @Put('orders/:id')
  @RequirePermissions('PRODUCTION_EDIT')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateProductionOrderDto, @CurrentUser('sub') userId: string) {
    return this.prodService.updateOrder(id, dto, userId);
  }

  @Delete('orders/:id')
  @RequirePermissions('PRODUCTION_DELETE')
  deleteOrder(@Param('id') id: string) { return this.prodService.deleteOrder(id); }

  @Get('status')
  @RequirePermissions('PRODUCTION_VIEW')
  getStatus() { return this.prodService.getStatus(); }
}