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
  @RequirePermissions('uretim_goruntuleme')
  findAllBoms(@Query() query: BomQueryDto) { return this.prodService.findAllBoms(query); }

  @Get('boms/:id')
  @RequirePermissions('uretim_goruntuleme')
  findOneBom(@Param('id', ParseIntPipe) id: number) { return this.prodService.findOneBom(id); }

  @Post('boms')
  @RequirePermissions('uretim_olusturma')
  createBom(@Body() dto: CreateBomDto, @CurrentUser('sub') userId: number) { 
    return this.prodService.createBom(dto, userId); 
  }

  @Put('boms/:id')
  @RequirePermissions('uretim_duzenleme')
  updateBom(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBomDto, @CurrentUser('sub') userId: number) {
    return this.prodService.updateBom(id, dto, userId);
  }

  @Delete('boms/:id')
  @RequirePermissions('uretim_silme')
  deleteBom(@Param('id', ParseIntPipe) id: number) { return this.prodService.deleteBom(id); }

  // ────── PRODUCTION ORDERS (Üretim Emirleri) ──────
  @Get('orders')
  @RequirePermissions('uretim_goruntuleme')
  findAllOrders(@Query() query: ProductionOrderQueryDto) { return this.prodService.findAllOrders(query); }

  @Get('orders/:id')
  @RequirePermissions('uretim_goruntuleme')
  findOneOrder(@Param('id', ParseIntPipe) id: number) { return this.prodService.findOneOrder(id); }

  @Post('orders')
  @RequirePermissions('uretim_olusturma')
  createOrder(@Body() dto: CreateProductionOrderDto, @CurrentUser('sub') userId: number) {
    return this.prodService.createOrder(dto, userId);
  }

  @Put('orders/:id')
  @RequirePermissions('uretim_duzenleme')
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductionOrderDto, @CurrentUser('sub') userId: number) {
    return this.prodService.updateOrder(id, dto, userId);
  }

  @Delete('orders/:id')
  @RequirePermissions('uretim_silme')
  deleteOrder(@Param('id', ParseIntPipe) id: number) { return this.prodService.deleteOrder(id); }

  @Get('status')
  @RequirePermissions('uretim_goruntuleme')
  getStatus() { return this.prodService.getStatus(); }
}