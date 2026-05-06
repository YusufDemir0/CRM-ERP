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

export const notesAPI = {
  getAll: (config?: AxiosRequestConfig) => api.get('/notes', config),
  create: (data: CreateNoteDto, config?: AxiosRequestConfig) => api.post('/notes', data, config),
  update: (id: string | number, data: UpdateNoteDto, config?: AxiosRequestConfig) => api.put(`/notes/${id}`, data, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/notes/${id}`, config),
};
