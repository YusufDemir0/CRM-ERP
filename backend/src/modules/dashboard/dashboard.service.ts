import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Party } from '../parties/entities/party.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { Department } from '../departments/entities/department.entity';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class DashboardService {
  private cache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
  ) {}

  async getSummary() {
    const now = Date.now();
    if (this.cache && (now - this.cache.timestamp) < this.CACHE_TTL) {
      return this.cache.data;
    }

    const [users, parties, items, transactions, departments] = await Promise.all([
      this.userRepo.count(),
      this.partyRepo.count(),
      this.itemRepo.count(),
      this.txRepo.count(),
      this.deptRepo.count(),
    ]);

    const criticalStocks = await this.itemRepo.count({ where: { state: 1 } });

    const result = {
      users,
      parties,
      items,
      transactions,
      departments,
      criticalStocks,
      cachedAt: DateUtils.getToday(),
    };

    this.cache = { data: result, timestamp: now };
    return result;
  }
}
