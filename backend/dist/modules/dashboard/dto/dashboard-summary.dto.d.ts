export declare class RecentActionDto {
    id: number;
    code: string;
    type: 'in' | 'out';
    amount: number;
    date: string;
    partyName: string;
    referenceType: string;
    description: string;
}
export declare class DashboardStatsDto {
    revenue: number;
    count: number;
    profit: number;
}
export declare class DashboardSummaryDto {
    totalCustomers: number;
    totalSalesCount: number;
    todaySales: number;
    thisMonth: DashboardStatsDto;
    lastMonth: DashboardStatsDto;
}
