import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Party } from '../parties/entities/party.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { Department } from '../departments/entities/department.entity';
import { Sale } from '../sales/entities/sale.entity';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
export declare class DashboardService {
    private userRepo;
    private partyRepo;
    private itemRepo;
    private txRepo;
    private deptRepo;
    private saleRepo;
    constructor(userRepo: Repository<User>, partyRepo: Repository<Party>, itemRepo: Repository<Item>, txRepo: Repository<Transaction>, deptRepo: Repository<Department>, saleRepo: Repository<Sale>);
    getSummary(user: JwtPayload): Promise<{
        totalCustomers: number;
        totalSalesCount: number;
        todaySales: any;
        thisMonth: {
            revenue: any;
            count: any;
            profit: any;
        };
        lastMonth: {
            revenue: any;
            count: any;
            profit: any;
        };
    }>;
}
