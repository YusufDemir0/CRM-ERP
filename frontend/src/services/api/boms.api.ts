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

export const bomsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Bom>>('/production/boms', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Bom>(`/production/boms/${id}`, config),
  create: (data: Partial<Bom>, config?: AxiosRequestConfig) => api.post('/production/boms', data, config),
  update: (id: string | number, data: Partial<Bom>, config?: AxiosRequestConfig) => api.put(`/production/boms/${id}`, data, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/production/boms/${id}`, config),
};
