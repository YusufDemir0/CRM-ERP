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

export const accountsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Account>>('/accounts', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Account>(`/accounts/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/accounts/status', config),
  create: (data: Partial<Account>, config?: AxiosRequestConfig) => api.post('/accounts', data, config),
  update: (id: string | number, data: Partial<Account>, config?: AxiosRequestConfig) => api.put(`/accounts/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/accounts/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/accounts/${id}`, config),
};
