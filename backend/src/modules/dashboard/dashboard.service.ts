import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Party } from '../parties/entities/party.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { Department } from '../departments/entities/department.entity';
import { plainToInstance } from 'class-transformer';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { Sale } from '../sales/entities/sale.entity';
import { Decimal } from 'decimal.js';
import dayjs from 'dayjs';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
  ) {}

  async getSummary() {
    // Tarih Aralıkları (dayjs ile)
    const now = dayjs();
    const todayStr = now.format('YYYY-MM-DD');
    
    // Bu Ay (Bugüne kadar - MTD)
    const thisMonthStart = now.startOf('month').toDate();
    const thisMonthEnd = now.toDate(); // Sadece bugüne kadar (MTD)
    
    // Geçen Ay (Aynı Dönem - PMTD)
    const lastMonthStart = now.subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = now.subtract(1, 'month').toDate();

    const [
      totalUsers,
      totalParties,
      totalItems,
      thisMonthSales,
      lastMonthSales,
      recentActions
    ] = await Promise.all([
      this.userRepo.count({ where: { state: 1 } }),
      this.partyRepo.count({ where: { state: 1 } }),
      this.itemRepo.count({ where: { state: 1 } }),
      
      // Bu Ayın Satışları (Bugüne kadar)
      this.saleRepo.find({
        where: { 
          createdAt: Between(thisMonthStart, thisMonthEnd)
        }
      }),

      // Geçen Ayın Satışları (Aynı döneme kadar - PMTD)
      this.saleRepo.find({
        where: { 
          createdAt: Between(lastMonthStart, lastMonthEnd)
        }
      }),

      // Son İşlemler
      this.txRepo.find({
        relations: ['party'],
        order: { createdAt: 'DESC' },
        take: 10
      })
    ]);

    const calculateStats = (sales: Sale[]) => {
      let revenue = new Decimal(0);
      let count = 0;

      sales.forEach(sale => {
        // İptal edilen satışlar ciroya ve adede dahil edilmez
        if (sale.status === 'cancelled') return;
        
        count++;
        const rate = new Decimal(sale.exchangeRate || 1);
        // "Net Satış" (KDV hariç, İndirimler düşülmüş tutar)
        const netSale = new Decimal(sale.grandTotal || 0).minus(sale.kdv || 0);
        revenue = revenue.plus(netSale.mul(rate));
      });

      return {
        revenue: revenue.toDecimalPlaces(2).toNumber(),
        count: count
      };
    };

    const thisMonthStats = calculateStats(thisMonthSales);
    const lastMonthStats = calculateStats(lastMonthSales);
    
    return plainToInstance(DashboardSummaryDto, {
      totalUsers,
      totalParties,
      totalItems,
      todaySales: 0,
      thisMonth: {
        revenue: thisMonthStats.revenue,
        count: thisMonthStats.count,
        profit: 0
      },
      lastMonth: {
        revenue: lastMonthStats.revenue,
        count: lastMonthStats.count,
        profit: 0
      },
      recentActions: recentActions.map(tx => ({
        id: tx.id,
        code: tx.code,
        type: tx.type,
        amount: tx.amount?.toString() || '0',
        date: tx.date,
        partyName: tx.party?.name || 'Genel İşlem',
        referenceType: tx.referenceType,
        description: tx.description
      }))
    });
  }
}
