import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';

import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto, StocksQueryDto, TransferStockDto } from '../dto/inventory.dto';
import { PaginatedResult, PaginationDto } from '../../../common/dto/pagination.dto';

import { StocksReportsService } from './stocks-reports.service';
import { StocksTransactionsService } from './stocks-transactions.service';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);

  constructor(
    private readonly reportsService: StocksReportsService,
    private readonly transactionsService: StocksTransactionsService,
  ) {}

  // ────── REPORTS DELEGATION ──────

  async findAll(query: StocksQueryDto, user?: JwtPayload): Promise<PaginatedResult<Stock>> {
    return this.reportsService.findAll(query, user);
  }

  async findAllMovements(query: PaginationDto & { type?: string; search?: string }, user?: JwtPayload): Promise<PaginatedResult<StockMovement>> {
    return this.reportsService.findAllMovements(query, user);
  }

  async getMovements(stockId: string, query: PaginationDto, user?: JwtPayload): Promise<PaginatedResult<StockMovement>> {
    return this.reportsService.getMovements(stockId, query, user);
  }

  async getCriticalStocks(query: Partial<PaginationDto> = {}, user?: JwtPayload): Promise<PaginatedResult<Stock> | Stock[]> {
    if (query.limit) {
      return this.reportsService.getCriticalStocks(query as PaginationDto, user);
    }
    // Backward compatibility for calls without pagination
    const res = await this.reportsService.getCriticalStocks({ page: 1, limit: 100000 } as PaginationDto, user);
    return res.data;
  }

  async getStockReport() {
    return this.reportsService.getStockReport();
  }

  async getStatus(user?: JwtPayload) {
    return this.reportsService.getStatus(user);
  }

  async getDepartmentStockSummary(query: { departmentId?: string }, user?: JwtPayload) {
    return this.reportsService.getDepartmentStockSummary(query, user);
  }

  // ────── TRANSACTIONS DELEGATION ──────

  async decreaseStock(
    itemId: string, 
    departmentId: string, 
    quantity: number | Decimal, 
    manager?: EntityManager, 
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    return this.transactionsService.decreaseStock(itemId, departmentId, quantity, manager, referenceInfo, userId);
  }

  async decreaseStockBulk(
    items: Array<{ itemId: string; quantity: number | Decimal | string }>,
    departmentId: string,
    manager?: EntityManager,
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    return this.transactionsService.decreaseStockBulk(items, departmentId, manager, referenceInfo, userId);
  }

  async reserveStockBulk(
    items: Array<{ itemId: string; quantity: number | Decimal | string }>,
    departmentId: string,
    manager?: EntityManager,
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    return this.transactionsService.reserveStockBulk(items, departmentId, manager, referenceInfo, userId);
  }

  async unreserveStockBulk(
    items: Array<{ itemId: string; quantity: number | Decimal | string }>,
    departmentId: string,
    manager?: EntityManager,
    userId?: string
  ): Promise<void> {
    return this.transactionsService.unreserveStockBulk(items, departmentId, manager, userId);
  }

  async finalizeShipmentBulk(
    items: Array<{ itemId: string; quantity: number | Decimal | string }>,
    departmentId: string,
    manager?: EntityManager,
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    return this.transactionsService.finalizeShipmentBulk(items, departmentId, manager, referenceInfo, userId);
  }

  async releaseStockBulk(
    items: Array<{ itemId: string; quantity: number | Decimal | string }>,
    departmentId: string,
    manager?: EntityManager,
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    return this.transactionsService.releaseStockBulk(items, departmentId, manager, referenceInfo, userId);
  }

  async increaseStock(
    itemId: string, 
    departmentId: string, 
    quantity: number | Decimal, 
    inUnitCost?: number | Decimal,
    manager?: EntityManager, 
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    return this.transactionsService.increaseStock(itemId, departmentId, quantity, inUnitCost, manager, referenceInfo, userId);
  }

  async adjustStock(dto: StockAdjustmentDto, userId: string): Promise<StockMovement> {
    return this.transactionsService.adjustStock(dto, userId);
  }

  async transferStock(dto: TransferStockDto, userId: string) {
    return this.transactionsService.transferStock(dto, userId);
  }

  async revertStockMovementsByReference(
    referenceType: StockMovement['referenceType'],
    referenceId: string,
    manager?: EntityManager,
    userId?: string
  ): Promise<void> {
    return this.transactionsService.revertStockMovementsByReference(referenceType, referenceId, manager, userId as string);
  }
}