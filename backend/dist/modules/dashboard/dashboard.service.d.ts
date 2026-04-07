import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Party } from '../parties/entities/party.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { Department } from '../departments/entities/department.entity';
export declare class DashboardService {
    private userRepo;
    private partyRepo;
    private itemRepo;
    private txRepo;
    private deptRepo;
    constructor(userRepo: Repository<User>, partyRepo: Repository<Party>, itemRepo: Repository<Item>, txRepo: Repository<Transaction>, deptRepo: Repository<Department>);
    getSummary(): Promise<{
        users: number;
        parties: number;
        items: number;
        transactions: number;
        departments: number;
        criticalStocks: number;
    }>;
}
