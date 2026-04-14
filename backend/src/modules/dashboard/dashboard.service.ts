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
      todaySalesRes,
      thisMonthSales,
      lastMonthSales,
      recentActions
    ] = await Promise.all([
      this.userRepo.count({ where: { state: 1 } }),
      this.partyRepo.count({ where: { state: 1 } }),
      this.itemRepo.count({ where: { state: 1 } }),
      
      // Bugünün Satışları
      this.txRepo.createQueryBuilder('tx')
        .where('tx.date = :today', { today: todayStr })
        .andWhere('tx.type = :type', { type: 'in' })
        .andWhere('tx.status = :status', { status: 'completed' })
        .select('SUM(tx.amount)', 'total')
        .getRawOne(),

      // Bu Ayın İstatistikleri
      this.txRepo.createQueryBuilder('tx')
        .where('tx.date BETWEEN :start AND :end', { start: thisMonthStart, end: thisMonthEnd })
        .andWhere('tx.type = :type', { type: 'in' })
        .andWhere('tx.status = :status', { status: 'completed' })
        .select('SUM(tx.amount)', 'revenue')
        .addSelect('COUNT(tx.id)', 'count')
        .getRawOne(),

      // Geçen Ayın İstatistikleri
      this.txRepo.createQueryBuilder('tx')
        .where('tx.date BETWEEN :start AND :end', { start: lastMonthStart, end: lastMonthEnd })
        .andWhere('tx.type = :type', { type: 'in' })
        .andWhere('tx.status = :status', { status: 'completed' })
        .select('SUM(tx.amount)', 'revenue')
        .addSelect('COUNT(tx.id)', 'count')
        .getRawOne(),

      // Son İşlemler (Gelişmiş)
      this.txRepo.find({
        relations: ['party'],
        order: { createdAt: 'DESC' },
        take: 10
      })
    ]);

    // Kâr tahmini (Şimdilik cironun %20'si olarak hesaplanıyor, ileride maliyet tabanlı kâr eklenebilir)
    const thisMonthRevenue = Number(thisMonthSales.revenue || 0);
    const lastMonthRevenue = Number(lastMonthSales.revenue || 0);
    
    return plainToInstance(DashboardSummaryDto, {
      totalUsers,
      totalParties,
      totalItems,
      todaySales: Number(todaySalesRes.total || 0),
      thisMonth: {
        revenue: thisMonthRevenue,
        count: Number(thisMonthSales.count || 0),
        profit: thisMonthRevenue * 0.20
      },
      lastMonth: {
        revenue: lastMonthRevenue,
        count: Number(lastMonthSales.count || 0),
        profit: lastMonthRevenue * 0.20
      },
      recentActions: recentActions.map(tx => ({
        id: tx.id,
        code: tx.code,
        type: tx.type,
        amount: Number(tx.amount || 0),
        date: tx.date,
        partyName: tx.party?.name || 'Genel İşlem',
        referenceType: tx.referenceType,
        description: tx.description
      }))
    });
  }
}
