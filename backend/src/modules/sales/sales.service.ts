import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Sale } from './entities/sale.entity';
import { SaleType } from './entities/sale-type.entity';
import { SalesReportsService } from './sales-reports.service';
import { SalesTransactionsService } from './sales-transactions.service';
import {
  CreateSaleDto,
  UpdateSaleDto,
  CreateSaleTypeDto,
  ApproveSaleDto,
  ShipSaleDto,
  SalesQueryDto,
} from './dto/sale.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { SaleItem } from './entities/sale-item.entity';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly reportsService: SalesReportsService,
    private readonly transactionsService: SalesTransactionsService,
  ) {}

  // ────── REPORTS DELEGATION ──────

  async findAllSaleTypes(): Promise<SaleType[]> {
    return this.reportsService.findAllSaleTypes();
  }

  async findAll(query: SalesQueryDto, user?: JwtPayload): Promise<PaginatedResult<Sale>> {
    return this.reportsService.findAll(query, user);
  }

  async findOne(id: string): Promise<Sale> {
    return this.reportsService.findOne(id);
  }

  async getStatus() {
    return this.reportsService.getStatus();
  }

  async exportToExcel(query: SalesQueryDto, user: JwtPayload, res: Response) {
    return this.reportsService.exportToExcel(query, user, res);
  }

  // ────── TRANSACTIONS DELEGATION ──────

  async createSaleType(dto: CreateSaleTypeDto, userId: string): Promise<SaleType> {
    return this.transactionsService.createSaleType(dto, userId);
  }

  async create(dto: CreateSaleDto, userId: string): Promise<Sale> {
    return this.transactionsService.create(dto, userId);
  }

  async update(id: string, dto: UpdateSaleDto, userId: string): Promise<Sale> {
    return this.transactionsService.update(id, dto, userId);
  }

  async approveSale(saleId: string, dto: ApproveSaleDto, userId: string): Promise<Sale> {
    return this.transactionsService.approveSale(saleId, dto, userId);
  }

  async cancelSale(saleId: string, userId: string): Promise<Sale> {
    return this.transactionsService.cancelSale(saleId, userId);
  }

  async shipSale(saleId: string, dto: ShipSaleDto, userId: string): Promise<Sale> {
    return this.transactionsService.shipSale(saleId, dto, userId);
  }

  async softDelete(id: string): Promise<void> {
    return this.transactionsService.softDelete(id);
  }
}