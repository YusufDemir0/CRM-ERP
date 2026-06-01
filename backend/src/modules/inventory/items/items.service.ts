import { Injectable, StreamableFile } from '@nestjs/common';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import {
  CreateItemDto,
  UpdateItemDto,
  CreateItemTypeDto,
  CreateQuantityTypeDto,
  CreateItemCodeGroupDto,
  ItemsQueryDto,
  ImportItemDto,
  UpdateItemTypeDto,
  UpdateQuantityTypeDto,
  UpdateItemCodeGroupDto
} from '../dto/inventory.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { ItemsReportsService } from './items-reports.service';
import { ItemsTransactionsService } from './items-transactions.service';

@Injectable()
export class ItemsService {
  constructor(
    private readonly reportsService: ItemsReportsService,
    private readonly transactionsService: ItemsTransactionsService,
  ) {}

  // ────── ITEMS REPORTS ──────

  async findAll(query: ItemsQueryDto): Promise<PaginatedResult<Item>> {
    return this.reportsService.findAll(query);
  }

  async findOne(id: string): Promise<Item> {
    return this.reportsService.findOne(id);
  }

  async getStatus() {
    return this.reportsService.getStatus();
  }

  async exportToExcel(query: ItemsQueryDto): Promise<StreamableFile> {
    return this.reportsService.exportToExcel(query);
  }

  async findAllItemTypes(): Promise<ItemType[]> {
    return this.reportsService.findAllItemTypes();
  }

  async findAllItemCodeGroups(): Promise<ItemCodeGroup[]> {
    return this.reportsService.findAllItemCodeGroups();
  }

  async findAllQuantityTypes(): Promise<QuantityType[]> {
    return this.reportsService.findAllQuantityTypes();
  }

  // ────── ITEMS TRANSACTIONS ──────

  async create(dto: CreateItemDto, userId: string): Promise<Item> {
    return this.transactionsService.create(dto, userId);
  }

  async update(id: string, dto: UpdateItemDto, userId: string): Promise<Item> {
    return this.transactionsService.update(id, dto, userId);
  }

  async importItems(items: ImportItemDto[], userId: string) {
    return this.transactionsService.importItems(items, userId);
  }

  async importFromExcel(buffer: Buffer, userId: string) {
    return this.transactionsService.importFromExcel(buffer, userId);
  }

  async getImportTemplate(): Promise<StreamableFile> {
    return this.reportsService.getImportTemplate();
  }

  async softDelete(id: string, currentUserId: string): Promise<void> {
    return this.transactionsService.softDelete(id, currentUserId);
  }

  async createItemType(dto: CreateItemTypeDto, userId: string): Promise<ItemType> {
    return this.transactionsService.createItemType(dto, userId);
  }

  async updateItemType(id: string, dto: UpdateItemTypeDto, userId: string): Promise<ItemType> {
    return this.transactionsService.updateItemType(id, dto, userId);
  }

  async softDeleteItemType(id: string): Promise<void> {
    return this.transactionsService.softDeleteItemType(id);
  }

  async createItemCodeGroup(dto: CreateItemCodeGroupDto, userId: string): Promise<ItemCodeGroup> {
    return this.transactionsService.createItemCodeGroup(dto, userId);
  }

  async updateItemCodeGroup(id: string, dto: UpdateItemCodeGroupDto, userId: string): Promise<ItemCodeGroup> {
    return this.transactionsService.updateItemCodeGroup(id, dto, userId);
  }

  async softDeleteItemCodeGroup(id: string): Promise<void> {
    return this.transactionsService.softDeleteItemCodeGroup(id);
  }

  async createQuantityType(dto: CreateQuantityTypeDto, userId: string): Promise<QuantityType> {
    return this.transactionsService.createQuantityType(dto, userId);
  }

  async updateQuantityType(id: string, dto: UpdateQuantityTypeDto, userId: string): Promise<QuantityType> {
    return this.transactionsService.updateQuantityType(id, dto, userId);
  }

  async softDeleteQuantityType(id: string): Promise<void> {
    return this.transactionsService.softDeleteQuantityType(id);
  }
}
