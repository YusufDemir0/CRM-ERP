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
} from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { useLoaderStore } from '../store/useLoaderStore';

// ────── AXIOS INSTANCE ──────

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// ────── INTERCEPTORS ──────

const MUTATION_METHODS = ['post', 'put', 'delete', 'patch'];
const isMutationMethod = (method?: string): boolean =>
  MUTATION_METHODS.includes(method?.toLowerCase() || '');

// ────── SILENT RE-AUTH QUEUE ──────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

export const resolveFailedRequests = () => {
  console.log('🛡️ Session: Thawing request queue...');
  isRefreshing = false;
  failedQueue.forEach((prom) => prom.resolve());
  failedQueue = [];
};

export const rejectFailedRequests = (error: unknown) => {
  console.log('🛡️ Session: Rejecting request queue...');
  isRefreshing = false;
  failedQueue.forEach((prom) => prom.reject(error));
  failedQueue = [];
};

// [FIX-TASK-02]: Centralized loader management via store-based counting

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isMutationMethod(config.method)) {
    useLoaderStore.getState().show();
  }

  return config;
});

interface ApiErrorData {
  message?: string | string[];
  error?: string;
  [key: string]: string | string[] | undefined;
}

api.interceptors.response.use(
  (response) => {
    if (isMutationMethod(response.config.method)) {
      useLoaderStore.getState().hide();
    }
    
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error) && isMutationMethod(error.config?.method)) {
      useLoaderStore.getState().hide();
    }

    if (axios.isAxiosError(error)) {
      const config = error.config;

      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401) {
        // [MODERNIZATION]: Silent Re-Auth Queuing & Refresh Token Flow
        const originalRequest = error.config;
        const isAuthRequest = config?.url?.includes('/auth/login') || 
                            config?.url?.includes('/auth/refresh');
        
        if (config?.url && !isAuthRequest) {
          console.warn('🛡️ Session: 401 Unauthorized detected. Freezing request...');
          
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then(() => api(originalRequest as AxiosRequestConfig))
              .catch((err) => Promise.reject(err));
          }

          isRefreshing = true;
          
          return authAPI.refresh()
            .then(() => {
              console.log('🛡️ Session: Token refreshed successfully. Resolving queued requests...');
              isRefreshing = false;
              resolveFailedRequests();
              return api(originalRequest as AxiosRequestConfig);
            })
            .catch((refreshError) => {
              console.error('🛡️ Session: Refresh failed. Prompting re-auth modal...');
              isRefreshing = false;
              rejectFailedRequests(refreshError);
              useAuthStore.getState().setReAuthModal(true);
              return Promise.reject(refreshError);
            });
        }
      }

      if (error.response && error.response.status !== 401) {
        let outputMessage = 'Sistemsel bir hata oluştu.';
        const data = error.response.data as ApiErrorData;
        
        if (data) {
          if (typeof data === 'string') {
            outputMessage = data;
          } else if (data.message) {
            outputMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message;
          } else if (data.error) {
            outputMessage = data.error;
          }
        }
        
        toast.error(String(outputMessage).substring(0, 255), { id: 'api-error' }); 
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ────── AUTH API ──────

export const authAPI = {
  login: (data: { username: string; password: string }, config?: AxiosRequestConfig) => api.post('/auth/login', data, config),
  logout: (config?: AxiosRequestConfig) => api.post('/auth/logout', {}, config),
  profile: (config?: AxiosRequestConfig) => api.get('/auth/profile', config),
  refresh: (config?: AxiosRequestConfig) => api.post('/auth/refresh', {}, config),
};

// ────── USERS API ──────

export const usersAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<User>>('/users', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<User>(`/users/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/users/status', config),
  create: (data: CreateUserDto, config?: AxiosRequestConfig) => api.post('/users', data, config),
  update: (id: string | number, data: UpdateUserDto, config?: AxiosRequestConfig) => api.put(`/users/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/users/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/users/${id}`, config),
};

// ────── ROLES API ──────

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

// ────── DEPARTMENTS API ──────

export const departmentsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Department>>('/departments', { params, ...config }),
  getTypes: (config?: AxiosRequestConfig) => api.get('/departments/types', config),
  createType: (data: { name: string }, config?: AxiosRequestConfig) => api.post('/departments/types', data, config),
  updateType: (id: string | number, data: { name: string }, config?: AxiosRequestConfig) => api.put(`/departments/types/${id}`, data, config),
  deleteType: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/departments/types/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/departments/status', config),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Department>(`/departments/${id}`, config),
  create: (data: Partial<Department>, config?: AxiosRequestConfig) => api.post('/departments', data, config),
  update: (id: string | number, data: Partial<Department>, config?: AxiosRequestConfig) => api.put(`/departments/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/departments/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/departments/${id}`, config),
};

// ────── PARTIES API ──────

export const partiesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Party>>('/parties', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Party>(`/parties/${id}`, config),
  getBalance: (id: string | number, config?: AxiosRequestConfig) => api.get<{ balance: number; creditLimit: number; currency: string; symbol: string }>(`/parties/${id}/balance`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/parties/status', config),
  create: (data: CreatePartyDto, config?: AxiosRequestConfig) => api.post('/parties', data, config),
  update: (id: string | number, data: UpdatePartyDto, config?: AxiosRequestConfig) => api.put(`/parties/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/parties/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/parties/${id}`, config),
};

// ────── ITEMS API ──────

export const itemsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Item>>('/items', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Item>(`/items/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/items/status', config),
  create: (data: Partial<Item>, config?: AxiosRequestConfig) => api.post('/items', data, config),
  update: (id: string | number, data: Partial<Item>, config?: AxiosRequestConfig) => api.put(`/items/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/items/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/items/${id}`, config),
  findAllItemTypes: (config?: AxiosRequestConfig) => api.get('/items/types', config),
  getTypes: (config?: AxiosRequestConfig) => api.get('/items/types', config),
  createItemType: (data: { name: string }, config?: AxiosRequestConfig) => api.post('/items/types', data, config),
  updateItemType: (id: string | number, data: { name: string }, config?: AxiosRequestConfig) => api.put(`/items/types/${id}`, data, config),
  deleteItemType: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/items/types/${id}`, config),
  getCodeGroups: (config?: AxiosRequestConfig) => api.get('/items/code-groups', config),
  createCodeGroup: (data: { name: string; prefix: string }, config?: AxiosRequestConfig) => api.post('/items/code-groups', data, config),
  updateCodeGroup: (id: string | number, data: { name: string; prefix: string }, config?: AxiosRequestConfig) => api.put(`/items/code-groups/${id}`, data, config),
  deleteCodeGroup: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/items/code-groups/${id}`, config),
  getQuantityTypes: (config?: AxiosRequestConfig) => api.get('/items/quantity-types', config),
  createQuantityType: (data: { name: string; abbreviation: string }, config?: AxiosRequestConfig) => api.post('/items/quantity-types', data, config),
  updateQuantityType: (id: string | number, data: { name: string; abbreviation: string }, config?: AxiosRequestConfig) => api.put(`/items/quantity-types/${id}`, data, config),
  deleteQuantityType: (id: string | number, config?: AxiosRequestConfig) => api.delete('/items/quantity-types', config),
  import: (items: ImportItemDto[], config?: AxiosRequestConfig) => api.post('/items/import', items, config),
  export: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get('/items/export', { params, responseType: 'blob', ...config }),
};

// ────── STOCKS API ──────

export const stocksAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Stock>>('/stocks', { params, ...config }),
  getStatus: (config?: AxiosRequestConfig) => api.get('/stocks/status', config),
  getCritical: (config?: AxiosRequestConfig) => api.get('/stocks/critical', config),
  getAllMovements: (params?: PaginationParams & { type?: string; search?: string }, config?: AxiosRequestConfig) => api.get<PaginatedResult<StockMovement>>('/stocks/movements', { params, ...config }),
  getMovements: (stockId: string | number, params?: PaginationParams, config?: AxiosRequestConfig) => api.get(`/stocks/${stockId}/movements`, { params, ...config }),
  adjust: (data: StockAdjustmentDto, config?: AxiosRequestConfig) => api.post('/stocks/adjust', data, config),
  transfer: (data: StockTransferDto, config?: AxiosRequestConfig) => api.post('/stocks/transfer', data, config),
  search: (query: string, config?: AxiosRequestConfig) => api.get<Array<{ itemId: number; itemName: string; totalQuantity: string; departmentQuantities: Record<number, string> }>>(`/stocks/search?q=${query}`, config),
};

// ────── SALES API ──────

export const salesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Sale>>('/sales', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Sale>(`/sales/${id}`, config),
  create: (data: CreateSaleDto, config?: AxiosRequestConfig) => api.post('/sales', data, config),
  update: (id: string | number, data: Partial<Sale>, config?: AxiosRequestConfig) => api.put(`/sales/${id}`, data, config),
  approve: (id: string | number, data: { departmentId: string | number; commercialAccountId?: string | number }, config?: AxiosRequestConfig) => api.post(`/sales/${id}/approve`, data, config),
  cancel: (id: string | number, config?: AxiosRequestConfig) => api.post(`/sales/${id}/cancel`, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/sales/${id}`, config),
  getTypes: (config?: AxiosRequestConfig) => api.get<SaleType[]>('/sales/types', config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/sales/status', config),
  ship: (id: string | number, data: { items: Array<{ itemId: string | number; quantity: string }> }, config?: AxiosRequestConfig) => api.post(`/sales/${id}/ship`, data, config),
  export: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get('/sales/export', { params, responseType: 'blob', ...config }),
};

// ────── CURRENCIES API ──────

export const currenciesAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Currency>>('/currencies', { params, ...config }),
  getDefault: (config?: AxiosRequestConfig) => api.get<Currency>('/currencies/default', config),
  create: (data: Partial<Currency>, config?: AxiosRequestConfig) => api.post('/currencies', data, config),
  update: (id: string | number, data: Partial<Currency>, config?: AxiosRequestConfig) => api.put(`/currencies/${id}`, data, config),
  setDefault: (id: string | number, config?: AxiosRequestConfig) => api.put(`/currencies/${id}/default`, {}, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/currencies/${id}`, config),
};

// ────── ACCOUNTS API ──────

export const accountsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Account>>('/accounts', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Account>(`/accounts/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/accounts/status', config),
  create: (data: Partial<Account>, config?: AxiosRequestConfig) => api.post('/accounts', data, config),
  update: (id: string | number, data: Partial<Account>, config?: AxiosRequestConfig) => api.put(`/accounts/${id}`, data, config),
  toggleState: (id: string | number, currentState: number, config?: AxiosRequestConfig) => api.put(`/accounts/${id}`, { state: currentState === 1 ? 0 : 1 }, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/accounts/${id}`, config),
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
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Transaction>(`/transactions/${id}`, config),
  create: (data: CreateTransactionDto, config?: AxiosRequestConfig) => api.post('/transactions', data, config),
  cancel: (id: string | number, config?: AxiosRequestConfig) => api.post(`/transactions/${id}/cancel`, config),
};

// ────── BOMS API ──────

export const bomsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<Bom>>('/production/boms', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Bom>(`/production/boms/${id}`, config),
  create: (data: Partial<Bom>, config?: AxiosRequestConfig) => api.post('/production/boms', data, config),
  update: (id: string | number, data: Partial<Bom>, config?: AxiosRequestConfig) => api.put(`/production/boms/${id}`, data, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/production/boms/${id}`, config),
};

// ────── PRODUCTION ORDERS API ──────

export const productionOrdersAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get<PaginatedResult<ProductionOrder>>('/production/orders', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<ProductionOrder>(`/production/orders/${id}`, config),
  create: (data: Partial<ProductionOrder>, config?: AxiosRequestConfig) => api.post('/production/orders', data, config),
  update: (id: string | number, data: Partial<ProductionOrder>, config?: AxiosRequestConfig) => api.put(`/production/orders/${id}`, data, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/production/orders/${id}`, config),
  getStatus: (config?: AxiosRequestConfig) => api.get('/production/status', config),
};

// ────── SETTINGS API ──────

export const settingsAPI = {
  getAll: (config?: AxiosRequestConfig) => api.get('/settings', config),
  getByKey: (key: string, config?: AxiosRequestConfig) => api.get(`/settings/${key}`, config),
  updateByKey: (key: string, value: string, config?: AxiosRequestConfig) => api.put(`/settings/${key}`, { settingKey: key, settingValue: value }, config),
  bulkUpdate: (settings: { settingKey: string; settingValue: string }[], config?: AxiosRequestConfig) => api.put('/settings', { settings }, config),
};

// ────── LOGS API ──────

export const logsAPI = {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => api.get('/logs', { params, ...config }),
  getNotifications: (config?: AxiosRequestConfig) => api.get<Log[]>('/logs/notifications', config),
  markAsRead: (id: string | number, config?: AxiosRequestConfig) => api.post(`/logs/notifications/${id}/read`, {}, config),
  markAllAsRead: (config?: AxiosRequestConfig) => api.post('/logs/notifications/read-all', {}, config),
};

// ────── NOTES API ──────

export const notesAPI = {
  getAll: (config?: AxiosRequestConfig) => api.get('/notes', config),
  create: (data: CreateNoteDto, config?: AxiosRequestConfig) => api.post('/notes', data, config),
  update: (id: string | number, data: UpdateNoteDto, config?: AxiosRequestConfig) => api.put(`/notes/${id}`, data, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/notes/${id}`, config),
};
// ────── STAFF API ──────

export const staffAPI = {
  getAll: (params?: PaginationParams & { departmentId?: string | number }, config?: AxiosRequestConfig) => api.get<PaginatedResult<Staff>>('/staff', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get<Staff>(`/staff/${id}`, config),
  create: (data: CreateStaffDto, config?: AxiosRequestConfig) => api.post<Staff>('/staff', data, config),
  update: (id: string | number, data: UpdateStaffDto, config?: AxiosRequestConfig) => api.put<Staff>(`/staff/${id}`, data, config),
  toggleActive: (id: string | number, config?: AxiosRequestConfig) => api.patch<{ isActive: boolean }>(`/staff/${id}/toggle-active`, {}, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/staff/${id}`, config),
};
