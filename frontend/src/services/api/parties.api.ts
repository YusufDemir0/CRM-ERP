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

export const partiesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Party>>('/parties', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Party>(`/parties/${id}`, config),
  getBalance: (id: string | number, config?: AxiosRequestConfig) => api.get<{ balance: number; creditLimit: number; currency: string; symbol: string }>(`/parties/${id}/balance`, config),
  getStatement: (id: string | number, config?: AxiosRequestConfig) => api.get<any[]>(`/parties/${id}/statement`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/parties/status', config),
  create: (data: CreatePartyDto, config?: AxiosRequestConfig) => api.post('/parties', data, config),
  update: (id: string | number, data: UpdatePartyDto, config?: AxiosRequestConfig) => api.put(`/parties/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/parties/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/parties/${id}`, config),
  lookup: (type?: string, config?: AxiosRequestConfig) => api.get<Party[]>('/parties/lookup', { params: { type }, ...config }),
  getAllMovements: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<any>>('/parties/all-movements', { params, ...config }),
};
