import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Item } from './items/entities/item.entity';
import { Stock } from './stocks/entities/stock.entity';
import { BomItem } from '../production/entities/bom-item.entity';
import { Decimal } from 'decimal.js';
import { ItemsService } from './items/items.service';

@Injectable()
export class InventoryOrchestratorService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    @InjectRepository(BomItem) private bomItemRepo: Repository<BomItem>,
    private dataSource: DataSource,
    private itemsService: ItemsService,
  ) {}

  /**
   * Bir ürünü güvenli şekilde siler veya pasife alır.
   * Stok ve Reçete (BOM) kontrollerini yapar.
   */
  async safeDelete(id: number, userId?: number): Promise<void> {
    await this.validateUsage(id);
    await this.itemsService.softDelete(id, userId);
  }

  /**
   * Ürün durumunu günceller, pasife alınıyorsa kullanım kontrolü yapar.
   */
  async safeUpdateState(id: number, newState: number, userId?: number): Promise<void> {
    if (newState === 0) {
      await this.validateUsage(id);
    }
    await this.itemsService.update(id, { state: newState }, userId);
  }

  /**
   * Ürünün stokta veya reçetelerde olup olmadığını kontrol eder.
   */
  private async validateUsage(id: number): Promise<void> {
    // 1. Stok kontrolü
    const totalStock = await this.stockRepo.createQueryBuilder('stock')
      .where('stock.itemId = :id', { id })
      .select('SUM(stock.quantity)', 'sum')
      .getRawOne();

    if (totalStock && totalStock.sum && new Decimal(totalStock.sum).gt(0)) {
      throw new BadRequestException(
        `Stokta ${totalStock.sum} adet bulunan ürün pasife alınamaz/silinemez. Lütfen önce stokları sıfırlayınız.`
      );
    }

    // 2. Reçete (BOM) kontrolü
    const usageCount = await this.bomItemRepo.count({ where: { itemId: id } });
    if (usageCount > 0) {
      throw new BadRequestException(
        `Bu ürün ${usageCount} farklı reçetede (BOM) kullanılmaktadır. Önce reçetelerden çıkarılmalıdır.`
      );
    }
  }
}
