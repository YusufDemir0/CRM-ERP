import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto, CreateItemCodeGroupDto, ItemsQueryDto, UpdateItemTypeDto, UpdateQuantityTypeDto, UpdateItemCodeGroupDto } from '../dto/inventory.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { InventoryOrchestratorService } from '../inventory-orchestrator.service';

@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly orchestrator: InventoryOrchestratorService,
  ) {}

  // ──── STATIC ROUTES MUST COME BEFORE :id ────

  @Get('status')
  @RequirePermissions('stok_goruntuleme')
  getStatus() { return this.itemsService.getStatus(); }

  @Get('types')
  findAllItemTypes() { return this.itemsService.findAllItemTypes(); }

  @Get('quantity-types')
  findAllQuantityTypes() { return this.itemsService.findAllQuantityTypes(); }

  @Get('code-groups')
  findAllCodeGroups() { return this.itemsService.findAllItemCodeGroups(); }

  // ──── PARAMETERIZED ROUTES ────

  @Get()
  @RequirePermissions('stok_goruntuleme')
  findAll(@Query() query: ItemsQueryDto) { return this.itemsService.findAll(query); }

  @Get(':id')
  @RequirePermissions('stok_goruntuleme')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.itemsService.findOne(id); }

  @Post()
  @RequirePermissions('stok_olusturma')
  create(@Body() dto: CreateItemDto, @CurrentUser('sub') userId: number) { return this.itemsService.create(dto, userId); }

  @Post('types')
  @RequirePermissions('stok_olusturma')
  createItemType(@Body() dto: CreateItemTypeDto, @CurrentUser('sub') userId: number) { return this.itemsService.createItemType(dto, userId); }

  @Post('code-groups')
  createCodeGroup(@Body() dto: CreateItemCodeGroupDto, @CurrentUser('sub') userId: number) {
    return this.itemsService.createItemCodeGroup(dto, userId);
  }

  @Post('quantity-types')
  createQuantityType(@Body() dto: CreateQuantityTypeDto, @CurrentUser('sub') userId: number) { return this.itemsService.createQuantityType(dto, userId); }

  @Put('quantity-types/:id')
  updateQuantityType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQuantityTypeDto, @CurrentUser('sub') userId: number) {
    return this.itemsService.updateQuantityType(id, dto, userId);
  }

  @Delete('quantity-types/:id')
  removeQuantityType(@Param('id', ParseIntPipe) id: number) { return this.itemsService.softDeleteQuantityType(id); }

  @Put('types/:id')
  @RequirePermissions('stok_duzenleme')
  updateItemType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemTypeDto, @CurrentUser('sub') userId: number) {
    return this.itemsService.updateItemType(id, dto, userId);
  }

  @Put('code-groups/:id')
  updateCodeGroup(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemCodeGroupDto, @CurrentUser('sub') userId: number) {
    return this.itemsService.updateItemCodeGroup(id, dto, userId);
  }

  @Put(':id')
  @RequirePermissions('stok_duzenleme')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemDto, @CurrentUser('sub') userId: number) {
    if (dto.state === 0) {
      return this.orchestrator.safeUpdateState(id, 0, userId);
    }
    return this.itemsService.update(id, dto, userId);
  }

  @Delete('types/:id')
  @RequirePermissions('stok_silme')
  removeItemType(@Param('id', ParseIntPipe) id: number) { return this.itemsService.softDeleteItemType(id); }

  @Delete('code-groups/:id')
  removeCodeGroup(@Param('id', ParseIntPipe) id: number) { return this.itemsService.softDeleteItemCodeGroup(id); }

  @Delete(':id')
  @RequirePermissions('stok_silme')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) { 
    return this.orchestrator.safeDelete(id, userId); 
  }
}
