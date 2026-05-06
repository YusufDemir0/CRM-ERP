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

export const productionOrdersAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<ProductionOrder>>('/production/orders', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<ProductionOrder>(`/production/orders/${id}`, config),
  create: (data: Partial<ProductionOrder>, config?: AxiosRequestConfig) => api.post('/production/orders', data, config),
  update: (id: string | number, data: Partial<ProductionOrder>, config?: AxiosRequestConfig) => api.put(`/production/orders/${id}`, data, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/production/orders/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/production/status', config),
};
