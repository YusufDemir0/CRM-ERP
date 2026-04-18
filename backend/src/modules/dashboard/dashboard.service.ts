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
  ) {}

  async getSummary() {
    // Tarih Aralıkları (dayjs ile)
    const now = dayjs();
    const todayStr = now.format('YYYY-MM-DD');
    
    // Bu Ay
    const thisMonthStart = now.startOf('month').format('YYYY-MM-DD');
    const thisMonthEnd = now.endOf('month').format('YYYY-MM-DD');
    
    // Geçen Ay
    const lastMonthStart = now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const lastMonthEnd = now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

    const [
      totalUsers,
      totalParties,
      totalItems,
      todayTransactions,
      thisMonthTransactions,
      lastMonthTransactions,
      recentActions
    ] = await Promise.all([
      this.userRepo.count({ where: { state: 1 } }),
      this.partyRepo.count({ where: { state: 1 } }),
      this.itemRepo.count({ where: { state: 1 } }),
      
      // Bugünün Satışları - Fetch raw for Decimal.js precision
      this.txRepo.find({
        where: { date: todayStr, type: 'in', status: 'completed' },
        select: ['amount', 'exchangeRate']
      }),

      // Bu Ayın İstatistikleri
      this.txRepo.find({
        where: { date: Between(thisMonthStart, thisMonthEnd), type: 'in', status: 'completed' },
        select: ['amount', 'exchangeRate']
      }),

      // Geçen Ayın İstatistikleri
      this.txRepo.find({
        where: { date: Between(lastMonthStart, lastMonthEnd), type: 'in', status: 'completed' },
        select: ['amount', 'exchangeRate']
      }),

      // Son İşlemler (Gelişmiş)
      this.txRepo.find({
        relations: ['party'],
        order: { createdAt: 'DESC' },
        take: 10
      })
    ]);

    const sumTL = (txs: { amount: Decimal; exchangeRate: Decimal }[]) => txs.reduce((sum, tx) => 
      sum.plus(new Decimal(tx.amount || 0).mul(new Decimal(tx.exchangeRate || 1))), 
      new Decimal(0)
    );

    const todaySales = sumTL(todayTransactions);
    const thisMonthRevenue = sumTL(thisMonthTransactions);
    const lastMonthRevenue = sumTL(lastMonthTransactions);
    
    return plainToInstance(DashboardSummaryDto, {
      totalUsers,
      totalParties,
      totalItems,
      todaySales: todaySales.toString(),
      thisMonth: {
        revenue: thisMonthRevenue.toString(),
        count: thisMonthTransactions.length,
        profit: thisMonthRevenue.mul(0.20).toString() 
      },
      lastMonth: {
        revenue: lastMonthRevenue.toString(),
        count: lastMonthTransactions.length,
        profit: lastMonthRevenue.mul(0.20).toString()
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
