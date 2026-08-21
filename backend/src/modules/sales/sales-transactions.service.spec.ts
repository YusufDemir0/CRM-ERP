import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesTransactionsService } from './sales-transactions.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleType } from './entities/sale-type.entity';
import { Party } from '../parties/entities/party.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { StocksService } from '../inventory/stocks/stocks.service';
import { LogsService } from '../logs/logs.service';
import { TransactionContextService } from '../../common/services/transaction-context.service';
import { OutboxService } from '../../common/services/outbox.service';
import { SalesReportsService } from './sales-reports.service';
import { EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';

jest.mock('@nestjs-cls/transactional', () => {
  return {
    Transactional: () => (target: unknown, key: string, descriptor: PropertyDescriptor) => {
      return descriptor;
    },
    TransactionHost: class {
      static getInstance() {
        return { tx: {} };
      }
    }
  };
});

import { TransactionHost } from '@nestjs-cls/transactional';

describe('SalesTransactionsService (Unit Tests for Shipping/Approval Validations)', () => {
  let service: SalesTransactionsService;
  let mockManager: {
    findOne: jest.Mock;
    query: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };

  const mockSaleRepo = {};
  const mockSaleItemRepo = {};
  const mockSaleTypeRepo = {};
  const mockSequenceGenerator = {};
  const mockStocksService = {
    reserveStockBulk: jest.fn().mockResolvedValue(null),
    finalizeShipmentBulk: jest.fn().mockResolvedValue(null),
    increaseStock: jest.fn().mockResolvedValue(null),
    revertStockMovementsByReference: jest.fn().mockResolvedValue(null),
  };
  const mockLogsService = { logActivity: jest.fn() };
  const mockOutboxService = { saveEvent: jest.fn().mockResolvedValue(null) };
  const mockReportsService = { findOne: jest.fn() };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      query: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      create: jest.fn().mockImplementation((entity: unknown, obj: unknown) => obj),
    };

    const mockTransactionContext = {
      get manager() {
        return mockManager;
      }
    };

    const mockTransactionHost = {
      get tx() {
        return mockManager;
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesTransactionsService,
        { provide: getRepositoryToken(Sale), useValue: mockSaleRepo },
        { provide: getRepositoryToken(SaleItem), useValue: mockSaleItemRepo },
        { provide: getRepositoryToken(SaleType), useValue: mockSaleTypeRepo },
        { provide: SequenceGeneratorService, useValue: mockSequenceGenerator },
        { provide: StocksService, useValue: mockStocksService },
        { provide: LogsService, useValue: mockLogsService },
        { provide: TransactionContextService, useValue: mockTransactionContext },
        { provide: OutboxService, useValue: mockOutboxService },
        { provide: SalesReportsService, useValue: mockReportsService },
        { provide: TransactionHost, useValue: mockTransactionHost },
      ],
    }).compile();

    service = module.get<SalesTransactionsService>(SalesTransactionsService);
  });

  describe('approveSale validation checks', () => {
    it('should reject virtual department (sanaldepo) during sale approval', async () => {
      // Mocking sale findOne
      mockManager.findOne.mockImplementation((entity: unknown) => {
        if (entity === Sale) {
          return Promise.resolve({
            id: 'sale-1',
            partyId: 'party-1',
            status: 'draft',
            grandTotal: new Decimal(1000),
            deposit: new Decimal(0),
            exchangeRate: new Decimal(1),
            items: [],
          });
        }
        if (entity === Party) {
          return Promise.resolve({
            id: 'party-1',
            creditLimit: new Decimal(0),
            balance: new Decimal(0),
          });
        }
        return Promise.resolve(null);
      });

      // Mocking department query to return 'sanaldepo'
      mockManager.query.mockResolvedValue([{ name: 'sanaldepo' }]);

      await expect(
        service.approveSale('sale-1', { departmentId: 'dept-virtual' }, 'user-1')
      ).rejects.toThrow(BadRequestException);

      expect(mockManager.query).toHaveBeenCalledWith(
        "SELECT name FROM departments WHERE id = ? LIMIT 1",
        ['dept-virtual']
      );
    });

    it('should pass virtual department check if physical department is selected', async () => {
      mockManager.findOne.mockImplementation((entity: unknown) => {
        if (entity === Sale) {
          return Promise.resolve({
            id: 'sale-1',
            partyId: 'party-1',
            status: 'draft',
            grandTotal: new Decimal(1000),
            deposit: new Decimal(0),
            exchangeRate: new Decimal(1),
            items: [],
          });
        }
        if (entity === Party) {
          return Promise.resolve({
            id: 'party-1',
            creditLimit: new Decimal(0),
            balance: new Decimal(0),
          });
        }
        return Promise.resolve(null);
      });

      // Mocking query to return a physical department 'Ana Depo'
      mockManager.query.mockResolvedValue([{ name: 'Ana Depo' }]);

      // Mocking reportsService.findOne to complete the method
      mockReportsService.findOne.mockResolvedValue({ id: 'sale-1' });

      const result = await service.approveSale('sale-1', { departmentId: 'dept-real' }, 'user-1');
      expect(result).toBeDefined();
    });
  });

  describe('shipSale validation checks', () => {
    it('should throw BadRequestException if sale is not fully paid', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 'sale-1',
        status: 'approved',
        grandTotal: new Decimal(1000),
        paidAmount: new Decimal(800), // Unpaid balance of 200
        items: [],
      });

      await expect(
        service.shipSale('sale-1', { items: [] }, 'user-1')
      ).rejects.toThrow(
        /Bu siparişin ödemesi tam olarak kapatılmamıştır/
      );
    });

    it('should throw BadRequestException if sale reservation department is virtual (sanaldepo)', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 'sale-1',
        status: 'approved',
        grandTotal: new Decimal(1000),
        paidAmount: new Decimal(1000), // Fully paid
        departmentId: 'dept-virtual',
        items: [],
      });

      // Mock query to return 'sanaldepo' name
      mockManager.query.mockResolvedValue([{ name: 'sanaldepo' }]);

      await expect(
        service.shipSale('sale-1', { items: [] }, 'user-1')
      ).rejects.toThrow(
        /Rezervasyon deposu 'sanaldepo' veya 'satisdepo' olamaz/
      );
    });
  });
});
