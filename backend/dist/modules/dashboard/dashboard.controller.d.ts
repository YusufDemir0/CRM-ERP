import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(): Promise<{
        users: number;
        parties: number;
        items: number;
        transactions: number;
        departments: number;
        criticalStocks: number;
    }>;
}
