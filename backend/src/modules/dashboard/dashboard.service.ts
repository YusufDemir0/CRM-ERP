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

  async getSummary(user: any) {
    // Tarih Aralıkları (dayjs ile)
    const now = dayjs();
    
    // Bugünün başlangıç ve bitişi (Günün Cirosu için)
    const todayStart = now.startOf('day').toDate();
    const todayEnd = now.endOf('day').toDate();
    
    // Bu Ay (Bugüne kadar - MTD)
    const thisMonthStart = now.startOf('month').toDate();
    const thisMonthEnd = now.toDate(); // Sadece bugüne kadar (MTD)
    
    // Geçen Ay (Aynı Dönem - PMTD)
    const lastMonthStart = now.subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = now.subtract(1, 'month').toDate();

    const [
      totalCustomers,
      totalSalesCount,
      todayRevenueStats,
      thisMonthStats,
      lastMonthStats,
    ] = await Promise.all([
      // Yalnızca kullanıcının oluşturduğu Cariler ve Sadece Müşteri
      this.partyRepo.count({ 
        where: { 
          state: 1, 
          type: 'customer',
          createdBy: user?.id 
        } 
      }),
      
      // Toplam Satış Miktarı
      this.saleRepo.count({ 
        where: { status: Between('approved', 'shipped') } 
      }),
      
      // Günün Cirosu
      this.saleRepo.createQueryBuilder('sale')
        .select("SUM(sale.grandTotal * sale.exchangeRate)", "revenue")
        .where("sale.createdAt BETWEEN :start AND :end", { start: todayStart, end: todayEnd })
        .andWhere("sale.status != 'cancelled'")
        .getRawOne(),

      // 🔥 HIGH PERFORMANCE: Use SQL aggregates instead of loading all entities into memory
      this.saleRepo.createQueryBuilder('sale')
        .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
        .addSelect("COUNT(*)", "count")
        .where("sale.createdAt BETWEEN :start AND :end", { start: thisMonthStart, end: thisMonthEnd })
        .andWhere("sale.status != 'cancelled'")
        .getRawOne(),

      this.saleRepo.createQueryBuilder('sale')
        .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
        .addSelect("COUNT(*)", "count")
        .where("sale.createdAt BETWEEN :start AND :end", { start: lastMonthStart, end: lastMonthEnd })
        .andWhere("sale.status != 'cancelled'")
        .getRawOne()
    ]);
    
    return {
      totalCustomers,
      totalSalesCount,
      todaySales: todayRevenueStats.revenue || 0,
      thisMonth: {
        revenue: thisMonthStats.revenue || 0,
        count: thisMonthStats.count || 0,
        profit: 0
      },
      lastMonth: {
        revenue: lastMonthStats.revenue || 0,
        count: lastMonthStats.count || 0,
        profit: 0
      }
    };
  }
}
