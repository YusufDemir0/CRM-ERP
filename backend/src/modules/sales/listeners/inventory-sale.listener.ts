import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StocksService } from '../../inventory/stocks/stocks.service';
import { Sale } from '../entities/sale.entity';
import { StockMovement } from '../../inventory/stocks/entities/stock-movement.entity';
import { Shipment } from '../../inventory/stocks/entities/shipment.entity';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class InventorySaleListener implements OnModuleInit {
  private readonly logger = new Logger(InventorySaleListener.name);

  constructor(
    private readonly stocksService: StocksService,
    private readonly dataSource: DataSource,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    this.setupConsumer();
    this.setupCancelConsumer();
  }

  private setupConsumer() {
    const trySubscribe = async () => {
      if (this.rabbitMQService.isConnected()) {
        await this.rabbitMQService.subscribe(
          'ermay.inventory.sale_approved',
          'sale.approved',
          async (msg) => {
            try {
              const payload = JSON.parse(msg.content.toString());
              await this.handleSaleApproved(payload);
            } catch (err) {
              this.logger.error(`Error processing inventory logic: ${err.message}`);
              throw err;
            }
          }
        );
      } else {
        setTimeout(trySubscribe, 2000);
      }
    };
    trySubscribe();
  }

  async handleSaleApproved(payload: { sale: Sale, departmentId: string, userId: string, items?: { itemId: string; departmentId: string; quantity: number }[] }) {
    const { sale, departmentId, userId } = payload;
    
    await this.dataSource.transaction(async (manager) => {
      const existingShipment = await manager.findOne(Shipment, {
        where: { saleId: sale.id }
      });

      if (existingShipment) {
        this.logger.warn(`Idempotency: Shipment for sale.id=${sale.id} already exists. Skipping.`);
        return;
      }

      // Create shipment record automatically from the physical warehouse
      const outgoingDeptId = sale.departmentId || departmentId || '1';

      const shipment = manager.create(Shipment, {
        saleId: sale.id,
        outgoingDepartmentId: outgoingDeptId,
        deliveryCity: sale.city || 'İstanbul',
        deliveryDistrict: sale.district || 'Merkez',
        deliveryAddress: sale.address || 'Adres belirtilmemiş',
        deadline: sale.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      });
      await manager.save(Shipment, shipment);
    });
  }

  private setupCancelConsumer() {
    const trySubscribe = async () => {
      if (this.rabbitMQService.isConnected()) {
        await this.rabbitMQService.subscribe(
          'ermay.inventory.sale_cancelled',
          'sale.cancelled',
          async (msg) => {
            try {
              const payload = JSON.parse(msg.content.toString());
              await this.handleSaleCancelled(payload);
            } catch (err) {
              this.logger.error(`Error processing inventory cancel logic: ${err.message}`);
              throw err;
            }
          }
        );
      } else {
        setTimeout(trySubscribe, 2000);
      }
    };
    trySubscribe();
  }

  async handleSaleCancelled(payload: { sale: Sale, userId: string }) {
    const { sale, userId } = payload;
    
    await this.dataSource.transaction(async (manager) => {
      // Get the virtual department (sanaldepo) ID
      const sanalDept = await manager.query(
        "SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1"
      );
      const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';

      // Find all reserve movements for this sale to see where they were reserved!
      const reserveMovements = await manager.find(StockMovement, {
        where: { referenceType: 'sale', referenceId: sale.id },
        relations: ['stock']
      });

      // Filter out sanaldepo movements as it does not hold reservations
      const physicalReserveMovements = reserveMovements.filter(
        m => m.stock && String(m.stock.departmentId) !== String(sanalDeptId)
      );

      // Group by departmentId
      const deptUnreserves = new Map<string, Array<{ itemId: string; quantity: Decimal }>>();
      
      for (const mov of physicalReserveMovements) {
        const stock = mov.stock;
        if (!stock) continue;
        
        const deptId = stock.departmentId;
        const list = deptUnreserves.get(deptId) || [];
        list.push({ itemId: stock.itemId, quantity: mov.quantity });
        deptUnreserves.set(deptId, list);
      }

      // Revert virtual stock deduction
      if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
          await this.stocksService.increaseStock(
            String(item.itemId),
            sanalDeptId,
            item.quantity,
            item.costPrice || 0,
            manager,
            {
              type: 'revert',
              id: sale.id,
              description: `Sanal Stok İptal İadesi: ${sale.code}`
            },
            userId
          );
        }
      }

      // Now release/unreserve bulk for each physical department!
      for (const [deptId, items] of deptUnreserves.entries()) {
        if (items.length > 0) {
          const itemsToRelease = items.map(item => ({
            itemId: item.itemId,
            quantity: new Decimal(item.quantity).toNumber()
          }));
          await this.stocksService.releaseStockBulk(
            itemsToRelease,
            deptId,
            manager,
            {
              type: 'revert',
              id: sale.id,
              description: `Sipariş İptali Rezervasyon İadesi: ${sale.code}`
            },
            userId
          );
        }
      }
    });
  }
}
