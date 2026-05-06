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

export const usersAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<User>>('/users', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<User>(`/users/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/users/status', config),
  create: (data: CreateUserDto, config?: AxiosRequestConfig) => api.post('/users', data, config),
  update: (id: string | number, data: UpdateUserDto, config?: AxiosRequestConfig) => api.put(`/users/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/users/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/users/${id}`, config),
};
