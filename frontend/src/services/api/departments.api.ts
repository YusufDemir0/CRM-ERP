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

export const departmentsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Department>>('/departments', { params, ...config }),
  getTypes: (config?: AxiosRequestConfig) => api.get('/departments/types', config),
  createType: (data: { name: string }, config?: AxiosRequestConfig) => api.post('/departments/types', data, config),
  updateType: (id: string | number, data: { name: string }, config?: AxiosRequestConfig) => api.put(`/departments/types/${id}`, data, config),
  deleteType: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/departments/types/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/departments/status', config),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Department>(`/departments/${id}`, config),
  create: (data: Partial<Department>, config?: AxiosRequestConfig) => api.post('/departments', data, config),
  update: (id: string | number, data: Partial<Department>, config?: AxiosRequestConfig) => api.put(`/departments/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/departments/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/departments/${id}`, config),
};
