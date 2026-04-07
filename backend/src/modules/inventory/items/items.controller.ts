import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto, ItemsQueryDto } from '../dto/inventory.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('items')
@UseGuards(AuthGuard('jwt'))
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @RequirePermissions('stok_goruntuleme')
  findAll(@Query() query: ItemsQueryDto) { return this.itemsService.findAll(query); }

  @Get('status')
  @RequirePermissions('stok_goruntuleme')
  getStatus() { return this.itemsService.getStatus(); }

  @Get('types')
  findAllItemTypes() { return this.itemsService.findAllItemTypes(); }

  @Get('quantity-types')
  findAllQuantityTypes() { return this.itemsService.findAllQuantityTypes(); }

  @Get(':id')
  @RequirePermissions('stok_goruntuleme')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.itemsService.findOne(id); }

  @Post()
  @RequirePermissions('stok_olusturma')
  create(@Body() dto: CreateItemDto, @CurrentUser('sub') userId: number) { return this.itemsService.create(dto, userId); }

  @Post('types')
  @RequirePermissions('stok_olusturma')
  createItemType(@Body() dto: CreateItemTypeDto, @CurrentUser('sub') userId: number) { return this.itemsService.createItemType(dto, userId); }

  @Post('quantity-types')
  createQuantityType(@Body() dto: CreateQuantityTypeDto, @CurrentUser('sub') userId: number) { return this.itemsService.createQuantityType(dto, userId); }

  @Put(':id')
  @RequirePermissions('stok_duzenleme')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemDto, @CurrentUser('sub') userId: number) {
    return this.itemsService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('stok_silme')
  remove(@Param('id', ParseIntPipe) id: number) { return this.itemsService.softDelete(id); }
}
