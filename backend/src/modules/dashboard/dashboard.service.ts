import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Party } from '../parties/entities/party.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { Department } from '../departments/entities/department.entity';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { Sale } from '../sales/entities/sale.entity';
import { Decimal } from 'decimal.js';
import dayjs from 'dayjs';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

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

  async getSummary(user: JwtPayload) {
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

    const isSystemAdmin = 
      user.isSystemAdmin === true || 
      (!!user.role && ['ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(user.role.toUpperCase())) ||
      (Array.isArray(user.permissions) && (user.permissions.includes('SALES_VIEW_ALL') || user.permissions.includes('sales_view_all')));

    const userDeptId = user.departmentId ? String(user.departmentId) : null;
    const userId = user.sub ? String(user.sub) : null;

    // Confirmed sale statuses for accurate financial reporting
    const confirmedStatuses = ['approved', 'shipped', 'invoiced'];

    // Base query builders for Sales
    const todayQb = this.saleRepo.createQueryBuilder('sale')
      .where("sale.createdAt BETWEEN :start AND :end", { start: todayStart, end: todayEnd })
      .andWhere("sale.status IN (:...confirmedStatuses)", { confirmedStatuses });

    const thisMonthQb = this.saleRepo.createQueryBuilder('sale')
      .where("sale.createdAt BETWEEN :start AND :end", { start: thisMonthStart, end: thisMonthEnd })
      .andWhere("sale.status IN (:...confirmedStatuses)", { confirmedStatuses });

    const lastMonthQb = this.saleRepo.createQueryBuilder('sale')
      .where("sale.createdAt BETWEEN :start AND :end", { start: lastMonthStart, end: lastMonthEnd })
      .andWhere("sale.status IN (:...confirmedStatuses)", { confirmedStatuses });

    const countQb = this.saleRepo.createQueryBuilder('sale')
      .where("sale.status IN (:...confirmedStatuses)", { confirmedStatuses });

    // Apply permissions filtering
    if (!isSystemAdmin) {
      if (userDeptId) {
        todayQb.andWhere("sale.departmentId = :deptId", { deptId: userDeptId });
        thisMonthQb.andWhere("sale.departmentId = :deptId", { deptId: userDeptId });
        lastMonthQb.andWhere("sale.departmentId = :deptId", { deptId: userDeptId });
        countQb.andWhere("sale.departmentId = :deptId", { deptId: userDeptId });
      } else {
        // If not system admin and has no department, they can only see their own sales
        todayQb.andWhere("sale.createdBy = :userId", { userId });
        thisMonthQb.andWhere("sale.createdBy = :userId", { userId });
        lastMonthQb.andWhere("sale.createdBy = :userId", { userId });
        countQb.andWhere("sale.createdBy = :userId", { userId });
      }
    }

    const partyWhere: Record<string, unknown> = { 
      state: 1, 
      type: 'customer' 
    };
    if (!isSystemAdmin) {
      // Note: parties might not have departmentId populated for old records
      if (userId) {
        partyWhere.createdBy = userId;
      }
    }

    const [
      totalCustomers,
      totalSalesCount,
      todayRevenueStats,
      thisMonthStats,
      lastMonthStats,
    ] = await Promise.all([
      // Toplam Müşteriler: Mutlak yetkisi yoksa SADECE kendi kaydettiği carileri görür
      this.partyRepo.count({ where: partyWhere }),
      
      countQb.getCount(),
      
      todayQb
        .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
        .getRawOne(),

      thisMonthQb
        .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
        .addSelect("SUM(sale.profit * sale.exchangeRate)", "profit")
        .addSelect("COUNT(*)", "count")
        .getRawOne(),

      lastMonthQb
        .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
        .addSelect("SUM(sale.profit * sale.exchangeRate)", "profit")
        .addSelect("COUNT(*)", "count")
        .getRawOne()
    ]);
    
    return {
      totalCustomers: Number(totalCustomers || 0),
      totalSalesCount: Number(totalSalesCount || 0),
      todaySales: new Decimal(todayRevenueStats?.revenue || 0).toNumber(),
      thisMonth: {
        revenue: new Decimal(thisMonthStats?.revenue || 0).toNumber(),
        count: Number(thisMonthStats?.count || 0),
        profit: new Decimal(thisMonthStats?.profit || 0).toNumber()
      },
      lastMonth: {
        revenue: new Decimal(lastMonthStats?.revenue || 0).toNumber(),
        count: Number(lastMonthStats?.count || 0),
        profit: new Decimal(lastMonthStats?.profit || 0).toNumber()
      }
    };
  }
}
