import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Party } from '../parties/entities/party.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { Department } from '../departments/entities/department.entity';

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
    const [users, parties, items, transactions, departments] = await Promise.all([
      this.userRepo.count(),
      this.partyRepo.count(),
      this.itemRepo.count(),
      this.txRepo.count(),
      this.deptRepo.count(),
    ]);

    // Opsiyonel: Kritik stok sayısını da ekleyebiliriz
    const criticalStocks = await this.itemRepo.count({ where: { state: 1 } }); // Basit bir örnek, state=1 aktif ürünler

    return {
      users,
      parties,
      items,
      transactions,
      departments,
      criticalStocks,
    };
  }
}
