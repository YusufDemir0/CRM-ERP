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

export const authAPI = {
  login: (data: { username: string; password: string }, config?: AxiosRequestConfig) => api.post('/auth/login', data, config),
  logout: (config?: AxiosRequestConfig) => api.post('/auth/logout', {}, config),
  profile: (config?: AxiosRequestConfig) => api.get('/auth/profile', config),
  refresh: (config?: AxiosRequestConfig) => api.post('/auth/refresh', {}, config),
};
