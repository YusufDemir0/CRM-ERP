import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// JWT token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 durumunda login'e yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── AUTH ───
export const authAPI = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
};

// ─── USERS ───
export const usersAPI = {
  getAll: (params?: Record<string, any>) => api.get('/users', { params }),
  getOne: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// ─── ROLES ───
export const rolesAPI = {
  getAll: (params?: Record<string, any>) => api.get('/roles', { params }),
  getOne: (id: number) => api.get(`/roles/${id}`),
  create: (data: any) => api.post('/roles', data),
  update: (id: number, data: any) => api.put(`/roles/${id}`, data),
  delete: (id: number) => api.delete(`/roles/${id}`),
  getPermissions: (params?: Record<string, any>) => api.get('/roles/permissions/all', { params }),
  createPermission: (data: any) => api.post('/roles/permissions', data),
  assignRole: (data: { userId: number; roleId: number }) => api.post('/roles/assign', data),
  removeRole: (data: { userId: number; roleId: number }) => api.delete('/roles/assign', { data }),
  setUserPermission: (data: any) => api.post('/roles/user-permissions', data),
  getUserPermissions: (userId: number) => api.get(`/roles/user-permissions/${userId}`),
};

// ─── DEPARTMENTS ───
export const departmentsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/departments', { params }),
  getOne: (id: number) => api.get(`/departments/${id}`),
  create: (data: any) => api.post('/departments', data),
  update: (id: number, data: any) => api.put(`/departments/${id}`, data),
  delete: (id: number) => api.delete(`/departments/${id}`),
};

// ─── PARTIES (CRM) ───
export const partiesAPI = {
  getAll: (params?: Record<string, any>) => api.get('/parties', { params }),
  getOne: (id: number) => api.get(`/parties/${id}`),
  getBalance: (id: number) => api.get(`/parties/${id}/balance`),
  create: (data: any) => api.post('/parties', data),
  update: (id: number, data: any) => api.put(`/parties/${id}`, data),
  delete: (id: number) => api.delete(`/parties/${id}`),
};

// ─── INVENTORY ───
export const itemsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/items', { params }),
  getOne: (id: number) => api.get(`/items/${id}`),
  create: (data: any) => api.post('/items', data),
  update: (id: number, data: any) => api.put(`/items/${id}`, data),
  delete: (id: number) => api.delete(`/items/${id}`),
  getTypes: () => api.get('/items/types'),
  createType: (data: any) => api.post('/items/types', data),
  getQuantityTypes: () => api.get('/items/quantity-types'),
};

export const stocksAPI = {
  getAll: (params?: Record<string, any>) => api.get('/stocks', { params }),
  getCritical: () => api.get('/stocks/critical'),
  getMovements: (stockId: number, params?: Record<string, any>) => api.get(`/stocks/${stockId}/movements`, { params }),
  adjust: (data: any) => api.post('/stocks/adjust', data),
};

// ─── SALES ───
export const salesAPI = {
  getAll: (params?: Record<string, any>) => api.get('/sales', { params }),
  getOne: (id: number) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  update: (id: number, data: any) => api.put(`/sales/${id}`, data),
  approve: (id: number, data: { departmentId: number }) => api.post(`/sales/${id}/approve`, data),
  cancel: (id: number) => api.post(`/sales/${id}/cancel`),
  delete: (id: number) => api.delete(`/sales/${id}`),
  getTypes: () => api.get('/sales/types'),
};

// ─── FINANCE ───
export const currenciesAPI = {
  getAll: (params?: any) => api.get('/currencies', { params }),
  getDefault: () => api.get('/currencies/default'),
  create: (data: any) => api.post('/currencies', data),
  update: (id: number, data: any) => api.put(`/currencies/${id}`, data),
};

export const accountsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/accounts', { params }),
  getOne: (id: number) => api.get(`/accounts/${id}`),
  create: (data: any) => api.post('/accounts', data),
  update: (id: number, data: any) => api.put(`/accounts/${id}`, data),
  delete: (id: number) => api.delete(`/accounts/${id}`),
};

export const transactionsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/transactions', { params }),
  getOne: (id: number) => api.get(`/transactions/${id}`),
  create: (data: any) => api.post('/transactions', data),
};

// ─── PRODUCTION ───
export const bomsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/production/boms', { params }),
  getOne: (id: number) => api.get(`/production/boms/${id}`),
  create: (data: any) => api.post('/production/boms', data),
  update: (id: number, data: any) => api.put(`/production/boms/${id}`, data),
  delete: (id: number) => api.delete(`/production/boms/${id}`),
};

export const productionOrdersAPI = {
  getAll: (params?: Record<string, any>) => api.get('/production/orders', { params }),
  getOne: (id: number) => api.get(`/production/orders/${id}`),
  create: (data: any) => api.post('/production/orders', data),
  update: (id: number, data: any) => api.put(`/production/orders/${id}`, data),
  delete: (id: number) => api.delete(`/production/orders/${id}`),
};

export const productionAPI = {
  getBoms: bomsAPI.getAll, // For backward compatibility where used
};
