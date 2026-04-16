import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import {
  PaginationParams,
  PaginatedResult,
  User, CreateUserDto, UpdateUserDto,
  Role, Permission,
  Department,
  Party, CreatePartyDto, UpdatePartyDto,
  Item,
  Stock, StockAdjustmentDto, StockTransferDto,
  Sale, SaleType,
  Currency,
  Account,
  Transaction, CreateTransactionDto,
  Bom,
  ProductionOrder,
  CreateNoteDto, UpdateNoteDto,
  CreateSaleDto
} from '../types';
import { useAuthStore } from '../store/useAuthStore';

// ────── AXIOS INSTANCE ──────

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  // xsrfCookieName disabled because httpOnly: true
});

// ────── INTERCEPTORS ──────

let csrfToken: string | null = null;

const MUTATION_METHODS = ['post', 'put', 'delete', 'patch'];

const isMutationMethod = (method?: string): boolean =>
  MUTATION_METHODS.includes(method?.toLowerCase() || '');

// FE-03: Request Tracking for Cancellation
const pendingRequests = new Map<string, AbortController>();

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // SEC-03: Manual CSRF attachment
  if (csrfToken && isMutationMethod(config.method)) {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }

  // FE-03: Abort previous pending request for the same URL if it's a GET search/filter
  if (config.method?.toLowerCase() === 'get' && config.url) {
    if (pendingRequests.has(config.url)) {
      pendingRequests.get(config.url)!.abort();
    }
    const controller = new AbortController();
    config.signal = controller.signal;
    pendingRequests.set(config.url, controller);
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const config = response.config;
    
    // SEC-03: Capture CSRF token from header
    const extractedToken = response.headers['x-csrf-token'];
    if (extractedToken) {
      csrfToken = extractedToken;
    }

    if (config.url) {
      pendingRequests.delete(config.url);
    }
    
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const config = error.config;

      if (config?.url) {
        pendingRequests.delete(config.url);
      }

      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      if (error.response && error.response.status !== 401) {
        let outputMessage = 'Sistemsel bir hata oluştu.';
        const data = error.response.data as Record<string, unknown> | string | null;
        
        if (data) {
          if (typeof data === 'string') {
            outputMessage = data;
          } else if (typeof data === 'object' && data !== null) {
            if ('message' in data) {
              outputMessage = Array.isArray(data.message)
                ? (data.message as string[]).join(', ')
                : String(data.message);
            } else if ('error' in data) {
              outputMessage = String(data.error);
            }
          }
        }
        
        const finalMsg = typeof outputMessage === 'string' ? outputMessage : JSON.stringify(outputMessage);
        toast.error(finalMsg.substring(0, 255)); 
      }

      if (error.response?.status === 401) {
        if (config?.url && !config.url.includes('/auth/login') && window.location.pathname !== '/login') {
          // FE-07: SPA-Friendly Logout & Redirect
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ────── AUTH API ──────

export const authAPI = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/auth/profile'),
};

// ────── USERS API ──────

export const usersAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<User>>('/users', { params, ...config }),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<User>(`/users/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/users/status', config),
  create: (data: CreateUserDto) => api.post('/users', data),
  update: (id: number, data: UpdateUserDto) => api.put(`/users/${id}`, data),
  toggleState: (id: number, currentState: number) => api.put(`/users/${id}`, { state: currentState === 1 ? 0 : 1 }),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// ────── ROLES API ──────

export const rolesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Role>>('/roles', { params, ...config }),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<Role>(`/roles/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/roles/status', config),
  create: (data: Partial<Role>, config?: AxiosRequestConfig) => api.post('/roles', data, config),
  update: (id: number, data: Partial<Role>, config?: AxiosRequestConfig) => api.put(`/roles/${id}`, data, config),
  toggleState: (id: number, currentState: number, config?: AxiosRequestConfig) => api.put(`/roles/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: number, config?: AxiosRequestConfig) => api.delete(`/roles/${id}`, config),
  getPermissions: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Permission>>('/roles/permissions/all', { params, ...config }),
  createPermission: (data: Partial<Permission>, config?: AxiosRequestConfig) => api.post('/roles/permissions', data, config),
  assignRole: (data: { userId: number; roleId: number }, config?: AxiosRequestConfig) => api.post('/roles/assign', data, config),
  removeRole: (data: { userId: number; roleId: number }, config?: AxiosRequestConfig) => api.delete('/roles/assign', { data, ...config }),
  setUserPermission: (data: { userId: number; permissionId: number; effect: 'allow' | 'deny'; scopeType?: string; scopeId?: number | null }, config?: AxiosRequestConfig) => api.post('/roles/user-permissions', data, config),
  getUserPermissions: (userId: number, config?: AxiosRequestConfig) => api.get(`/roles/user-permissions/${userId}`, config),
};

// ────── DEPARTMENTS API ──────

export const departmentsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Department>>('/departments', { params, ...config }),
  getTypes: (config?: AxiosRequestConfig) => api.get('/departments/types', config),
  createType: (data: { name: string }, config?: AxiosRequestConfig) => api.post('/departments/types', data, config),
  updateType: (id: number, data: { name: string }, config?: AxiosRequestConfig) => api.put(`/departments/types/${id}`, data, config),
  deleteType: (id: number, config?: AxiosRequestConfig) => api.delete(`/departments/types/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/departments/status', config),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<Department>(`/departments/${id}`, config),
  create: (data: Partial<Department>, config?: AxiosRequestConfig) => api.post('/departments', data, config),
  update: (id: number, data: Partial<Department>, config?: AxiosRequestConfig) => api.put(`/departments/${id}`, data, config),
  toggleState: (id: number, currentState: number, config?: AxiosRequestConfig) => api.put(`/departments/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: number, config?: AxiosRequestConfig) => api.delete(`/departments/${id}`, config),
};

// ────── PARTIES API ──────

export const partiesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Party>>('/parties', { params, ...config }),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<Party>(`/parties/${id}`, config),
  getBalance: (id: number, config?: AxiosRequestConfig) => api.get<{ balance: number; creditLimit: number; currency: string; symbol: string }>(`/parties/${id}/balance`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/parties/status', config),
  create: (data: CreatePartyDto, config?: AxiosRequestConfig) => api.post('/parties', data, config),
  update: (id: number, data: UpdatePartyDto, config?: AxiosRequestConfig) => api.put(`/parties/${id}`, data, config),
  toggleState: (id: number, currentState: number, config?: AxiosRequestConfig) => api.put(`/parties/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: number, config?: AxiosRequestConfig) => api.delete(`/parties/${id}`, config),
};

// ────── ITEMS API ──────

export const itemsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Item>>('/items', { params, ...config }),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<Item>(`/items/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/items/status', config),
  create: (data: Partial<Item>, config?: AxiosRequestConfig) => api.post('/items', data, config),
  update: (id: number, data: Partial<Item>, config?: AxiosRequestConfig) => api.put(`/items/${id}`, data, config),
  toggleState: (id: number, currentState: number, config?: AxiosRequestConfig) => api.put(`/items/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: number, config?: AxiosRequestConfig) => api.delete(`/items/${id}`, config),
  findAllItemTypes: (config?: AxiosRequestConfig) => api.get('/items/types', config),
  getTypes: (config?: AxiosRequestConfig) => api.get('/items/types', config),
  createItemType: (data: { name: string }, config?: AxiosRequestConfig) => api.post('/items/types', data, config),
  updateItemType: (id: number, data: { name: string }, config?: AxiosRequestConfig) => api.put(`/items/types/${id}`, data, config),
  deleteItemType: (id: number, config?: AxiosRequestConfig) => api.delete(`/items/types/${id}`, config),
  getCodeGroups: (config?: AxiosRequestConfig) => api.get('/items/code-groups', config),
  createCodeGroup: (data: { name: string; prefix: string }, config?: AxiosRequestConfig) => api.post('/items/code-groups', data, config),
  updateCodeGroup: (id: number, data: { name: string; prefix: string }, config?: AxiosRequestConfig) => api.put(`/items/code-groups/${id}`, data, config),
  deleteCodeGroup: (id: number, config?: AxiosRequestConfig) => api.delete(`/items/code-groups/${id}`, config),
  getQuantityTypes: (config?: AxiosRequestConfig) => api.get('/items/quantity-types', config),
  createQuantityType: (data: { name: string; abbreviation: string }, config?: AxiosRequestConfig) => api.post('/items/quantity-types', data, config),
  updateQuantityType: (id: number, data: { name: string; abbreviation: string }, config?: AxiosRequestConfig) => api.put(`/items/quantity-types/${id}`, data, config),
  deleteQuantityType: (id: number, config?: AxiosRequestConfig) => api.delete('/items/quantity-types', config),
};

// ────── STOCKS API ──────

export const stocksAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Stock>>('/stocks', { params, ...config }),
  getStatus: (config?: AxiosRequestConfig) => api.get('/stocks/status', config),
  getCritical: (config?: AxiosRequestConfig) => api.get('/stocks/critical', config),
  getMovements: (stockId: number, params?: PaginationParams, config?: AxiosRequestConfig) => api.get(`/stocks/${stockId}/movements`, { params, ...config }),
  adjust: (data: StockAdjustmentDto, config?: AxiosRequestConfig) => api.post('/stocks/adjust', data, config),
  transfer: (data: StockTransferDto, config?: AxiosRequestConfig) => api.post('/stocks/transfer', data, config),
  search: (query: string, config?: AxiosRequestConfig) => api.get<Array<{ itemId: number; itemName: string; totalQuantity: string; departmentQuantities: Record<number, string> }>>(`/stocks/search?q=${query}`, config),
};

// ────── SALES API ──────

export const salesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Sale>>('/sales', { params, ...config }),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<Sale>(`/sales/${id}`, config),
  create: (data: CreateSaleDto, config?: AxiosRequestConfig) => api.post('/sales', data, config),
  update: (id: number, data: Partial<Sale>, config?: AxiosRequestConfig) => api.put(`/sales/${id}`, data, config),
  approve: (id: number, data: { departmentId: number; commercialAccountId?: number }, config?: AxiosRequestConfig) => api.post(`/sales/${id}/approve`, data, config),
  cancel: (id: number, config?: AxiosRequestConfig) => api.post(`/sales/${id}/cancel`, config),
  delete: (id: number, config?: AxiosRequestConfig) => api.delete(`/sales/${id}`, config),
  getTypes: (config?: AxiosRequestConfig) => api.get<SaleType[]>('/sales/types', config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/sales/status', config),
  ship: (id: number, data: { items: Array<{ itemId: number; quantity: string }> }, config?: AxiosRequestConfig) => api.post(`/sales/${id}/ship`, data, config),
};

// ────── CURRENCIES API ──────

export const currenciesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<Currency[]>('/currencies', { params, ...config }),
  getDefault: (config?: AxiosRequestConfig) => api.get<Currency>('/currencies/default', config),
  create: (data: Partial<Currency>, config?: AxiosRequestConfig) => api.post('/currencies', data, config),
  update: (id: number, data: Partial<Currency>, config?: AxiosRequestConfig) => api.put(`/currencies/${id}`, data, config),
  setDefault: (id: number, config?: AxiosRequestConfig) => api.put(`/currencies/${id}/default`, {}, config),
  delete: (id: number, config?: AxiosRequestConfig) => api.delete(`/currencies/${id}`, config),
};

// ────── ACCOUNTS API ──────

export const accountsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Account>>('/accounts', { params, ...config }),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<Account>(`/accounts/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/accounts/status', config),
  create: (data: Partial<Account>, config?: AxiosRequestConfig) => api.post('/accounts', data, config),
  update: (id: number, data: Partial<Account>, config?: AxiosRequestConfig) => api.put(`/accounts/${id}`, data, config),
  toggleState: (id: number, currentState: number, config?: AxiosRequestConfig) => api.put(`/accounts/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: number, config?: AxiosRequestConfig) => api.delete(`/accounts/${id}`, config),
};

// ────── DASHBOARD API ──────

export const dashboardAPI = {
  getSummary: (config?: AxiosRequestConfig) => api.get('/dashboard/summary', config),
};

// ────── TRANSACTIONS API ──────

export const transactionsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Transaction>>('/transactions', { params, ...config }),
  getStatus: (config?: AxiosRequestConfig) => api.get('/transactions/status', config),
  getTrends: (config?: AxiosRequestConfig) => api.get('/transactions/trends', config),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<Transaction>(`/transactions/${id}`, config),
  create: (data: CreateTransactionDto, config?: AxiosRequestConfig) => api.post('/transactions', data, config),
  cancel: (id: number, config?: AxiosRequestConfig) => api.post(`/transactions/${id}/cancel`, config),
};

// ────── BOMS API ──────

export const bomsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Bom>>('/production/boms', { params, ...config }),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<Bom>(`/production/boms/${id}`, config),
  create: (data: Partial<Bom>, config?: AxiosRequestConfig) => api.post('/production/boms', data, config),
  update: (id: number, data: Partial<Bom>, config?: AxiosRequestConfig) => api.put(`/production/boms/${id}`, data, config),
  delete: (id: number, config?: AxiosRequestConfig) => api.delete(`/production/boms/${id}`, config),
};

// ────── PRODUCTION ORDERS API ──────

export const productionOrdersAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<ProductionOrder>>('/production/orders', { params, ...config }),
  getOne: (id: number, config?: AxiosRequestConfig) => api.get<ProductionOrder>(`/production/orders/${id}`, config),
  create: (data: Partial<ProductionOrder>, config?: AxiosRequestConfig) => api.post('/production/orders', data, config),
  update: (id: number, data: Partial<ProductionOrder>, config?: AxiosRequestConfig) => api.put(`/production/orders/${id}`, data, config),
  delete: (id: number, config?: AxiosRequestConfig) => api.delete(`/production/orders/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/production/status', config),
};

// ────── SETTINGS API ──────

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByKey: (key: string) => api.get(`/settings/${key}`),
  updateByKey: (key: string, value: string) => api.put(`/settings/${key}`, { settingKey: key, settingValue: value }),
  bulkUpdate: (settings: { settingKey: string; settingValue: string }[]) => api.put('/settings', { settings }),
};

// ────── LOGS API ──────

export const logsAPI = {
  getAll: (params?: PaginationParams) => api.get('/logs', { params }),
};

// ────── NOTES API ──────

export const notesAPI = {
  getAll: () => api.get('/notes'),
  create: (data: CreateNoteDto) => api.post('/notes', data),
  update: (id: number, data: UpdateNoteDto) => api.put(`/notes/${id}`, data),
  delete: (id: number) => api.delete(`/notes/${id}`),
};