import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, BadRequestException, UseInterceptors, UploadedFile, StreamableFile, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, ImportItemDto, CreateItemTypeDto, CreateQuantityTypeDto, CreateItemCodeGroupDto, ItemsQueryDto, UpdateItemTypeDto, UpdateQuantityTypeDto, UpdateItemCodeGroupDto } from '../dto/inventory.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

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
    @Body() body: unknown,
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @CurrentUser('sub') userId: string
  ) {
    if (file) {
      return this.itemsService.importFromExcel(file.buffer, userId);
    }
    
    // Otherwise fallback to JSON body (backward compatibility or manual client lists)
    let items: ImportItemDto[] | null = null;
    if (Array.isArray(body)) {
      items = body as ImportItemDto[];
    } else if (body && typeof body === 'object') {
      const bodyRecord = body as Record<string, unknown>;
      if (Array.isArray(bodyRecord.items)) {
        items = bodyRecord.items as ImportItemDto[];
      }
    }

    if (!items) {
      throw new BadRequestException('Veri formatı hatalı. Excel dosyası veya JSON listesi bekleniyor.');
    }
    return this.itemsService.importItems(items, userId);
  }

  @Get('import-template')
  @RequirePermissions('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  async getImportTemplate(): Promise<StreamableFile> {
    return this.itemsService.getImportTemplate();
  }

  @Get('export')
  @RequirePermissions('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  async exportItems(@Query() query: ItemsQueryDto) {
    return this.itemsService.exportToExcel(query);
  }

  @Get('status')
  @RequirePermissions('INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  getStatus() { return this.itemsService.getStatus(); }

  @Get('types')
  @RequirePermissions('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  findAllItemTypes() { return this.itemsService.findAllItemTypes(); }

  @Get('quantity-types')
  @RequirePermissions('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  findAllQuantityTypes() { return this.itemsService.findAllQuantityTypes(); }

  @Get('code-groups')
  @RequirePermissions('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  findAllCodeGroups() { return this.itemsService.findAllItemCodeGroups(); }

  // ──── PARAMETERIZED ROUTES ────

  @Get()
  @RequirePermissions('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  findAll(@Query() query: ItemsQueryDto) { return this.itemsService.findAll(query); }

  @Get(':id')
  @RequirePermissions('INVENTORY_USE_SELECTION', 'INVENTORY_VIEW', 'INVENTORY_VIEW_DEPT', 'INVENTORY_VIEW_ALL')
  findOne(@Param('id') id: string) { return this.itemsService.findOne(id); }

  @Post()
  @RequirePermissions('INVENTORY_CREATE')
  create(@Body() dto: CreateItemDto, @CurrentUser('sub') userId: string) { return this.itemsService.create(dto, userId); }

  @Post('types')
  @RequirePermissions('INVENTORY_CREATE')
  createItemType(@Body() dto: CreateItemTypeDto, @CurrentUser('sub') userId: string) { return this.itemsService.createItemType(dto, userId); }

  @Post('code-groups')
  @RequirePermissions('INVENTORY_CREATE')
  createCodeGroup(@Body() dto: CreateItemCodeGroupDto, @CurrentUser('sub') userId: string) {
    return this.itemsService.createItemCodeGroup(dto, userId);
  }

  @Post('quantity-types')
  @RequirePermissions('INVENTORY_CREATE')
  createQuantityType(@Body() dto: CreateQuantityTypeDto, @CurrentUser('sub') userId: string) { return this.itemsService.createQuantityType(dto, userId); }

  @Put('quantity-types/:id')
  @RequirePermissions('INVENTORY_EDIT')
  updateQuantityType(@Param('id') id: string, @Body() dto: UpdateQuantityTypeDto, @CurrentUser('sub') userId: string) {
    return this.itemsService.updateQuantityType(id, dto, userId);
  }

  @Delete('quantity-types/:id')
  @RequirePermissions('INVENTORY_DELETE')
  removeQuantityType(@Param('id') id: string) { return this.itemsService.softDeleteQuantityType(id); }

  @Put('types/:id')
  @RequirePermissions('INVENTORY_EDIT')
  updateItemType(@Param('id') id: string, @Body() dto: UpdateItemTypeDto, @CurrentUser('sub') userId: string) {
    return this.itemsService.updateItemType(id, dto, userId);
  }

  @Put('code-groups/:id')
  @RequirePermissions('INVENTORY_EDIT')
  updateCodeGroup(@Param('id') id: string, @Body() dto: UpdateItemCodeGroupDto, @CurrentUser('sub') userId: string) {
    return this.itemsService.updateItemCodeGroup(id, dto, userId);
  }

  @Put(':id')
  @RequirePermissions('INVENTORY_EDIT', 'INVENTORY_EDIT_PRICE', 'INVENTORY_EDIT_COST', 'INVENTORY_EDIT_STOCK_LIMIT')
  update(@Param('id') id: string, @Body() dto: UpdateItemDto, @CurrentUser() user: JwtPayload) {
    const isSystemAdmin = user.isSystemAdmin;
    const permissions = user.permissions || [];
    if (!isSystemAdmin) {
      if (dto.salePrice !== undefined && !permissions.includes('INVENTORY_EDIT_PRICE')) {
        throw new ForbiddenException('Satış fiyatlarını düzenlemek için yetkiniz bulunmamaktadır.');
      }
      if (dto.purchasePrice !== undefined && !permissions.includes('INVENTORY_EDIT_COST')) {
        throw new ForbiddenException('Alış/maliyet fiyatlarını düzenlemek için yetkiniz bulunmamaktadır.');
      }
      if (dto.criticalLimit !== undefined && !permissions.includes('INVENTORY_EDIT_STOCK_LIMIT')) {
        throw new ForbiddenException('Kritik stok limitlerini düzenlemek için yetkiniz bulunmamaktadır.');
      }
    }
    return this.itemsService.update(id, dto, String(user.sub));
  }

  @Delete('types/:id')
  @RequirePermissions('INVENTORY_DELETE')
  removeItemType(@Param('id') id: string) { return this.itemsService.softDeleteItemType(id); }

  @Delete('code-groups/:id')
  @RequirePermissions('INVENTORY_DELETE')
  removeCodeGroup(@Param('id') id: string) { return this.itemsService.softDeleteItemCodeGroup(id); }

  @Delete(':id')
  @RequirePermissions('INVENTORY_DELETE')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) { 
    return this.itemsService.softDelete(id, userId); 
  }
}
