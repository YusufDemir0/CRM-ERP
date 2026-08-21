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

export const transactionsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Transaction>>('/transactions', { params, ...config }),
  getStatus: (config?: AxiosRequestConfig) => api.get('/transactions/status', config),
  getTrends: (config?: AxiosRequestConfig) => api.get('/transactions/trends', config),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Transaction>(`/transactions/${id}`, config),
  create: (data: CreateTransactionDto, config?: AxiosRequestConfig) => api.post('/transactions', data, config),
  transfer: (data: { fromAccountId: string; toAccountId: string; amount: string | number; currencyId?: string; date: string; description?: string }, config?: AxiosRequestConfig) => api.post('/transactions/transfer', data, config),
  cancel: (id: string | number, config?: AxiosRequestConfig) => api.post(`/transactions/${id}/cancel`, config),
};
