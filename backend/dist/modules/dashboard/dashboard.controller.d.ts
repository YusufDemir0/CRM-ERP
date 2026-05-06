import { DashboardService } from './dashboard.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
