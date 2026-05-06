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

export const settingsAPI = {
  getAll: (config?: AxiosRequestConfig) => api.get('/settings', config),
  getByKey: (key: string, config?: AxiosRequestConfig) => api.get(`/settings/${key}`, config),
  updateByKey: (key: string, value: string, config?: AxiosRequestConfig) => api.put(`/settings/${key}`, { settingKey: key, settingValue: value }, config),
  bulkUpdate: (settings: { settingKey: string; settingValue: string }[], config?: AxiosRequestConfig) => api.put('/settings', { settings }, config),
};
