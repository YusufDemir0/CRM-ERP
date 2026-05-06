import api from './core';
import { AxiosRequestConfig } from 'axios';
import {
  PaginationParams,
  PaginatedResult,
  User, CreateUserDto, UpdateUserDto,
  Role, Permission,
  Department,
  Party, CreatePartyDto, UpdatePartyDto,
  Item,
  Stock, StockMovement, StockAdjustmentDto, StockTransferDto,
  Sale, SaleType,
  Currency,
  Account,
  Transaction, CreateTransactionDto,
  Bom,
  ProductionOrder,
  CreateNoteDto, UpdateNoteDto,
  CreateSaleDto,
  Staff, CreateStaffDto, UpdateStaffDto,
  ImportItemDto,
  Log
} from '../../types';

export const stocksAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Stock>>('/stocks', { params, ...config }),
  getStatus: (config?: AxiosRequestConfig) => api.get('/stocks/status', config),
  getCritical: (config?: AxiosRequestConfig) => api.get('/stocks/critical', config),
  getAllMovements: (params?: PaginationParams & { type?: string; search?: string }, config?: AxiosRequestConfig) => api.get<PaginatedResult<StockMovement>>('/stocks/movements', { params, ...config }),
  getMovements: (stockId: string | number, params?: PaginationParams, config?: AxiosRequestConfig) => api.get(`/stocks/${stockId}/movements`, { params, ...config }),
  adjust: (data: StockAdjustmentDto, config?: AxiosRequestConfig) => api.post('/stocks/adjust', data, config),
  transfer: (data: StockTransferDto, config?: AxiosRequestConfig) => api.post('/stocks/transfer', data, config),
  search: (query: string, config?: AxiosRequestConfig) => api.get<Array<{ itemId: number; itemName: string; totalQuantity: string; departmentQuantities: Record<number, string> }>>(`/stocks/search?q=${query}`, config),
};
