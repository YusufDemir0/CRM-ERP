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

export const logsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get('/logs', { params, ...config }),
  getNotifications: (config?: AxiosRequestConfig) => api.get<Log[]>('/logs/notifications', config),
  markAsRead: (id: string | number, config?: AxiosRequestConfig) => api.post(`/logs/notifications/${id}/read`, {}, config),
  markAllAsRead: (config?: AxiosRequestConfig) => api.post('/logs/notifications/read-all', {}, config),
};
