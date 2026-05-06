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

export const staffAPI = {
  getAll: (params?: PaginationParams & { departmentId?: string | number }, config?: AxiosRequestConfig) => api.get<PaginatedResult<Staff>>('/staff', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Staff>(`/staff/${id}`, config),
  create: (data: CreateStaffDto, config?: AxiosRequestConfig) => api.post<Staff>('/staff', data, config),
  update: (id: string | number, data: UpdateStaffDto, config?: AxiosRequestConfig) => api.put<Staff>(`/staff/${id}`, data, config),
  toggleActive: (id: string | number, config?: AxiosRequestConfig) => api.patch<{ isActive: boolean }>(`/staff/${id}/toggle-active`, {}, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/staff/${id}`, config),
};
