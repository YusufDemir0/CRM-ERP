import { EntitySubscriberInterface, EventSubscriber, UpdateEvent, InsertEvent, RemoveEvent } from 'typeorm';
import { Stock } from '../entities/stock.entity';
import { Item } from '../../items/entities/item.entity';
import { Decimal } from 'decimal.js';

@EventSubscriber()
export class StockSubscriber implements EntitySubscriberInterface<Stock> {
  listenTo() {
    return Stock;
  }

  async afterInsert(event: InsertEvent<Stock>) {
    await this.updateItemTotalStock(event.entity.itemId, event);
  }

  async afterUpdate(event: UpdateEvent<Stock>) {
    if (event.entity && event.entity.itemId) {
        await this.updateItemTotalStock(event.entity.itemId, event);
    }
  }

  async afterRemove(event: RemoveEvent<Stock>) {
    if (event.entityId) {
       // Since it's a uniqueitemId/departmentId, we need to find the item
       const stock = await event.manager.getRepository(Stock).findOne({ where: { id: event.entityId as any } });
       if (stock) {
           await this.updateItemTotalStock(stock.itemId, event);
       }
    }
  }

  private async updateItemTotalStock(itemId: number, event: InsertEvent<Stock> | UpdateEvent<Stock> | RemoveEvent<Stock>) {
    const manager = event.manager;
    
    // 🔥 HIGH-PERFORMANCE: Sum all stocks for this item and update the denormalized field.
    // While we could do +/- math, a full sum is safer against drift and still very fast for a single item (indexed).
    const result = await manager.getRepository(Stock)
      .createQueryBuilder('stock')
      .select('SUM(stock.quantity)', 'total')
      .where('stock.item_id = :itemId', { itemId })
      .getRawOne();

    const total = new Decimal(result?.total || 0);
    
    await manager.getRepository(Item).update(itemId, { 
      totalStock: total 
    });
  }
}
