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

export const rolesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Role>>('/roles', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Role>(`/roles/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/roles/status', config),
  create: (data: Partial<Role>, config?: AxiosRequestConfig) => api.post('/roles', data, config),
  update: (id: string | number, data: Partial<Role>, config?: AxiosRequestConfig) => api.put(`/roles/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/roles/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/roles/${id}`, config),
  getPermissions: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Permission>>('/roles/permissions/all', { params, ...config }),
  createPermission: (data: Partial<Permission>, config?: AxiosRequestConfig) => api.post('/roles/permissions', data, config),
  assignRole: (data: { userId: string | number; roleId: string | number }, config?: AxiosRequestConfig) => api.post('/roles/assign', data, config),
  removeRole: (data: { userId: string | number; roleId: string | number }, config?: AxiosRequestConfig) => api.delete('/roles/assign', { data, ...config }),
  setUserPermission: (data: { userId: string | number; permissionId: string | number; effect: 'allow' | 'deny'; scopeType?: string; scopeId?: string | number | null }, config?: AxiosRequestConfig) => api.post('/roles/user-permissions', data, config),
  getUserPermissions: (userId: string | number, config?: AxiosRequestConfig) => api.get(`/roles/user-permissions/${userId}`, config),
  removeUserPermission: (data: { userId: string | number; permissionId: string | number }, config?: AxiosRequestConfig) => api.delete('/roles/user-permissions', { data, ...config }),
};
