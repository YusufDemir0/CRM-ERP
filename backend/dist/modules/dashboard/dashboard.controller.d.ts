import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(user: any): Promise<{
        totalCustomers: number;
        totalSalesCount: number;
        todaySales: any;
        thisMonth: {
            revenue: any;
            count: any;
            profit: number;
        };
        lastMonth: {
            revenue: any;
            count: any;
            profit: number;
        };
    }>;
}
