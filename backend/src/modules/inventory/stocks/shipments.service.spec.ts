import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { Shipment } from './entities/shipment.entity';
import { StocksTransactionsService } from './stocks-transactions.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { LogsService } from '../../logs/logs.service';
import { Sale } from '../../sales/entities/sale.entity';
import { Decimal } from 'decimal.js';

import { SalesTransactionsService } from '../../sales/sales-transactions.service';

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

describe('ShipmentsService (Unit Tests for Dispatch Validations)', () => {
  let service: ShipmentsService;
  let mockManager: {
    findOne: jest.Mock;
    query: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };

  const mockShipmentRepo = {};
  const mockStocksTransactionsService = {
    moveStock: jest.fn().mockResolvedValue(null),
    increaseStock: jest.fn().mockResolvedValue(null),
  };
  const mockLogsService = {
    logActivity: jest.fn(),
  };
  const mockSalesTransactionsService = {
    cancelSale: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      query: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
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
        ShipmentsService,
        { provide: getRepositoryToken(Shipment), useValue: mockShipmentRepo },
        { provide: StocksTransactionsService, useValue: mockStocksTransactionsService },
        { provide: TransactionContextService, useValue: mockTransactionContext },
        { provide: LogsService, useValue: mockLogsService },
        { provide: TransactionHost, useValue: mockTransactionHost },
        { provide: SalesTransactionsService, useValue: mockSalesTransactionsService },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
  });

  describe('dispatch validation checks', () => {
    it('should throw BadRequestException if associated sale is not fully paid', async () => {
      // Mock finding shipment and sale
      mockManager.findOne.mockImplementation((entity: unknown) => {
        if (entity === Shipment) {
          return Promise.resolve({
            id: 'shipment-1',
            status: 'pending',
            outgoingDepartmentId: 'dept-real',
            saleId: 'sale-1',
            sale: {
              id: 'sale-1',
              grandTotal: new Decimal(2000),
              paidAmount: new Decimal(1500), // Unpaid balance
            }
          });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.dispatch('shipment-1', {}, 'user-1')
      ).rejects.toThrow(
        /Bu siparişin ödemesi tam olarak kapatılmamıştır/
      );
    });

    it('should throw BadRequestException if outgoing department is virtual (sanaldepo)', async () => {
      // Mock finding shipment with fully paid sale but virtual department
      mockManager.findOne.mockImplementation((entity: unknown) => {
        if (entity === Shipment) {
          return Promise.resolve({
            id: 'shipment-1',
            status: 'pending',
            outgoingDepartmentId: 'dept-virtual',
            saleId: 'sale-1',
            sale: {
              id: 'sale-1',
              grandTotal: new Decimal(2000),
              paidAmount: new Decimal(2000), // Fully paid
            }
          });
        }
        return Promise.resolve(null);
      });

      // Mock query resolving virtual department name
      mockManager.query.mockResolvedValue([{ name: 'sanaldepo' }]);

      await expect(
        service.dispatch('shipment-1', {}, 'user-1')
      ).rejects.toThrow(
        /Sevkiyat çıkış deposu 'sanaldepo' veya 'satisdepo' olamaz/
      );
    });

    it('should dispatch successfully when physical warehouse is used and sale is fully paid', async () => {
      // Mock finding shipment with fully paid sale and physical department
      mockManager.findOne.mockImplementation((entity: unknown) => {
        if (entity === Shipment) {
          return Promise.resolve({
            id: 'shipment-1',
            status: 'pending',
            outgoingDepartmentId: 'dept-real',
            saleId: 'sale-1',
            sale: {
              id: 'sale-1',
              grandTotal: new Decimal(2000),
              paidAmount: new Decimal(2000), // Fully paid
            }
          });
        }
        return Promise.resolve(null);
      });

      // Mock query returning a real department name
      mockManager.query.mockResolvedValue([{ name: 'Ana Depo' }]);

      // Mock save to return shipment
      mockManager.save.mockImplementation((entity: unknown, obj: unknown) => {
        return Promise.resolve(obj);
      });

      const result = await service.dispatch('shipment-1', { carrierNameOrPlate: '34ABC123' }, 'user-1');
      expect(result).toBeDefined();
      expect(mockManager.save).toHaveBeenCalled();
    });
  });
});
