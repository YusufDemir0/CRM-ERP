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

export const salesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Sale>>('/sales', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Sale>(`/sales/${id}`, config),
  create: (data: CreateSaleDto, config?: AxiosRequestConfig) => api.post('/sales', data, config),
  update: (id: string | number, data: Partial<Sale>, config?: AxiosRequestConfig) => api.put(`/sales/${id}`, data, config),
  approve: (id: string | number, data: { departmentId: string | number; commercialAccountId?: string | number }, config?: AxiosRequestConfig) => api.post(`/sales/${id}/approve`, data, config),
  cancel: (id: string | number, config?: AxiosRequestConfig) => api.post(`/sales/${id}/cancel`, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/sales/${id}`, config),
  getTypes: (config?: AxiosRequestConfig) => api.get<SaleType[]>('/sales/types', config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/sales/status', config),
  ship: (id: string | number, data: { items: Array<{ itemId: string | number; quantity: string }> }, config?: AxiosRequestConfig) => api.post(`/sales/${id}/ship`, data, config),
  export: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get('/sales/export', { params, responseType: 'blob', ...config }),
};
