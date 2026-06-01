import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, BadRequestException, UseInterceptors, UploadedFile, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, ImportItemDto, CreateItemTypeDto, CreateQuantityTypeDto, CreateItemCodeGroupDto, ItemsQueryDto, UpdateItemTypeDto, UpdateQuantityTypeDto, UpdateItemCodeGroupDto } from '../dto/inventory.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
  ) {}

  // ──── STATIC ROUTES MUST COME BEFORE :id ────

  @Post('import')
  @RequirePermissions('INVENTORY_CREATE')
  @UseInterceptors(FileInterceptor('file'))
  async importItems(
    @Body() body: any,
    @UploadedFile() file: any,
    @CurrentUser('sub') userId: string
  ) {
    if (file) {
      return this.itemsService.importFromExcel(file.buffer, userId);
    }
    
    // Otherwise fallback to JSON body (backward compatibility or manual client lists)
    const items = Array.isArray(body) ? body : (Array.isArray(body?.items) ? body.items : null);
    if (!items || !Array.isArray(items)) {
      throw new BadRequestException('Veri formatı hatalı. Excel dosyası veya JSON listesi bekleniyor.');
    }
    return this.itemsService.importItems(items, userId);
  }

  @Get('import-template')
  @RequirePermissions('INVENTORY_VIEW')
  async getImportTemplate(): Promise<StreamableFile> {
    return this.itemsService.getImportTemplate();
  }

  @Get('export')
  @RequirePermissions('INVENTORY_VIEW')
  async exportItems(@Query() query: ItemsQueryDto) {
    return this.itemsService.exportToExcel(query);
  }

  @Get('status')
  @RequirePermissions('INVENTORY_VIEW')
  getStatus() { return this.itemsService.getStatus(); }

  @Get('types')
  findAllItemTypes() { return this.itemsService.findAllItemTypes(); }

  @Get('quantity-types')
  findAllQuantityTypes() { return this.itemsService.findAllQuantityTypes(); }

  @Get('code-groups')
  findAllCodeGroups() { return this.itemsService.findAllItemCodeGroups(); }

  // ──── PARAMETERIZED ROUTES ────

  @Get()
  @RequirePermissions('INVENTORY_VIEW')
  findAll(@Query() query: ItemsQueryDto) { return this.itemsService.findAll(query); }

  @Get(':id')
  @RequirePermissions('INVENTORY_VIEW')
  findOne(@Param('id') id: string) { return this.itemsService.findOne(id); }

  @Post()
  @RequirePermissions('INVENTORY_CREATE')
  create(@Body() dto: CreateItemDto, @CurrentUser('sub') userId: string) { return this.itemsService.create(dto, userId); }

  @Post('types')
  @RequirePermissions('INVENTORY_CREATE')
  createItemType(@Body() dto: CreateItemTypeDto, @CurrentUser('sub') userId: string) { return this.itemsService.createItemType(dto, userId); }

  @Post('code-groups')
  createCodeGroup(@Body() dto: CreateItemCodeGroupDto, @CurrentUser('sub') userId: string) {
    return this.itemsService.createItemCodeGroup(dto, userId);
  }

  @Post('quantity-types')
  createQuantityType(@Body() dto: CreateQuantityTypeDto, @CurrentUser('sub') userId: string) { return this.itemsService.createQuantityType(dto, userId); }

  @Put('quantity-types/:id')
  updateQuantityType(@Param('id') id: string, @Body() dto: UpdateQuantityTypeDto, @CurrentUser('sub') userId: string) {
    return this.itemsService.updateQuantityType(id, dto, userId);
  }

  @Delete('quantity-types/:id')
  removeQuantityType(@Param('id') id: string) { return this.itemsService.softDeleteQuantityType(id); }

  @Put('types/:id')
  @RequirePermissions('INVENTORY_EDIT')
  updateItemType(@Param('id') id: string, @Body() dto: UpdateItemTypeDto, @CurrentUser('sub') userId: string) {
    return this.itemsService.updateItemType(id, dto, userId);
  }

  @Put('code-groups/:id')
  updateCodeGroup(@Param('id') id: string, @Body() dto: UpdateItemCodeGroupDto, @CurrentUser('sub') userId: string) {
    return this.itemsService.updateItemCodeGroup(id, dto, userId);
  }

  @Put(':id')
  @RequirePermissions('INVENTORY_EDIT')
  update(@Param('id') id: string, @Body() dto: UpdateItemDto, @CurrentUser('sub') userId: string) {
    return this.itemsService.update(id, dto, userId);
  }

  @Delete('types/:id')
  @RequirePermissions('INVENTORY_DELETE')
  removeItemType(@Param('id') id: string) { return this.itemsService.softDeleteItemType(id); }

  @Delete('code-groups/:id')
  removeCodeGroup(@Param('id') id: string) { return this.itemsService.softDeleteItemCodeGroup(id); }

  @Delete(':id')
  @RequirePermissions('INVENTORY_DELETE')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) { 
    return this.itemsService.softDelete(id, userId); 
  }
}
