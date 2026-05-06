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

export const currenciesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Currency>>('/currencies', { params, ...config }),
  getDefault: (config?: AxiosRequestConfig) => api.get<Currency>('/currencies/default', config),
  create: (data: Partial<Currency>, config?: AxiosRequestConfig) => api.post('/currencies', data, config),
  update: (id: string | number, data: Partial<Currency>, config?: AxiosRequestConfig) => api.put(`/currencies/${id}`, data, config),
  setDefault: (id: string | number, config?: AxiosRequestConfig) => api.put(`/currencies/${id}/default`, {}, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/currencies/${id}`, config),
};
