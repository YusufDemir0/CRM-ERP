import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Party } from '../parties/entities/party.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { Department } from '../departments/entities/department.entity';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { Sale } from '../sales/entities/sale.entity';
export declare class DashboardService {
    private userRepo;
    private partyRepo;
    private itemRepo;
    private txRepo;
    private deptRepo;
    private saleRepo;
    constructor(userRepo: Repository<User>, partyRepo: Repository<Party>, itemRepo: Repository<Item>, txRepo: Repository<Transaction>, deptRepo: Repository<Department>, saleRepo: Repository<Sale>);
    getSummary(): Promise<DashboardSummaryDto>;
}
