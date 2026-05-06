import { Expose, Type } from 'class-transformer';

export class RecentActionDto {
  @Expose() id: string;
  @Expose() code: string;
  @Expose() type: 'in' | 'out';
  @Expose() amount: number;
  @Expose() date: string;
  @Expose() partyName: string;
  @Expose() referenceType: string;
  @Expose() description: string;
}

export class DashboardStatsDto {
  @Expose() revenue: number;
  @Expose() count: number;
  @Expose() profit: number;
}

export class DashboardSummaryDto {
  @Expose() totalCustomers: number;
  @Expose() totalSalesCount: number;
  @Expose() todaySales: number;

  @Expose()
  @Type(() => DashboardStatsDto)
  thisMonth: DashboardStatsDto;

  @Expose()
  @Type(() => DashboardStatsDto)
  lastMonth: DashboardStatsDto;
}
