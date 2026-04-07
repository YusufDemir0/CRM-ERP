import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: İstek atılmadan önce loader'ı tetikle ve token'ı ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // POST, PUT, DELETE işlemlerinde işleniyor ekranını göster
  if (config.method &&['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
    window.dispatchEvent(new CustomEvent('show-loader'));
  }

  return config;
});

// Response interceptor: Başarılı istekte onay ver ve F5 yap, hatada işlemi sonlandır
api.interceptors.response.use(
  (response) => {
    // İşlem başarılıysa loader'ı gizle ve teyit alıp F5 at
    if (response.config.method && ['post', 'put', 'delete'].includes(response.config.method.toLowerCase())) {
      window.dispatchEvent(new Event('hide-loader'));
      
      // Login endpoint'ini F5 döngüsüne sokmamak için hariç tutuyoruz
      if (response.config.url && !response.config.url.includes('/auth/login')) {
        alert("İşlem Başarılı!");
        window.location.reload();
      }
    }
    return response;
  },
  (error) => {
    window.dispatchEvent(new Event('hide-loader'));

    if (error.response?.status === 401) {
      if (error.config.url && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        window.location.href = '/login';
      }
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
  getStatus: () => api.get('/users/status'),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  toggleState: (id: number, currentState: number) => api.put(`/users/${id}`, { state: currentState === 1 ? 0 : 1 }),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// ─── ROLES ───
export const rolesAPI = {
  getAll: (params?: Record<string, any>) => api.get('/roles', { params }),
  getOne: (id: number) => api.get(`/roles/${id}`),
  getStatus: () => api.get('/roles/status'),
  create: (data: any) => api.post('/roles', data),
  update: (id: number, data: any) => api.put(`/roles/${id}`, data),
  toggleState: (id: number, currentState: number) => api.put(`/roles/${id}`, { state: currentState === 1 ? 0 : 1 }),
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
  getTypes: () => api.get('/departments/types'),
  getStatus: () => api.get('/departments/status'),
  getOne: (id: number) => api.get(`/departments/${id}`),
  create: (data: any) => api.post('/departments', data),
  update: (id: number, data: any) => api.put(`/departments/${id}`, data),
  toggleState: (id: number, currentState: number) => api.put(`/departments/${id}`, { state: currentState === 1 ? 0 : 1 }),
  delete: (id: number) => api.delete(`/departments/${id}`),
};

// ─── PARTIES (CRM) ───
export const partiesAPI = {
  getAll: (params?: Record<string, any>) => api.get('/parties', { params }),
  getOne: (id: number) => api.get(`/parties/${id}`),
  getBalance: (id: number) => api.get(`/parties/${id}/balance`),
  getStatus: () => api.get('/parties/status'),
  create: (data: any) => api.post('/parties', data),
  update: (id: number, data: any) => api.put(`/parties/${id}`, data),
  toggleState: (id: number, currentState: number) => api.put(`/parties/${id}`, { state: currentState === 1 ? 0 : 1 }),
  delete: (id: number) => api.delete(`/parties/${id}`),
};

// ─── INVENTORY ───
export const itemsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/items', { params }),
  getOne: (id: number) => api.get(`/items/${id}`),
  getStatus: () => api.get('/items/status'),
  create: (data: any) => api.post('/items', data),
  update: (id: number, data: any) => api.put(`/items/${id}`, data),
  toggleState: (id: number, currentState: number) => api.put(`/items/${id}`, { state: currentState === 1 ? 0 : 1 }),
  delete: (id: number) => api.delete(`/items/${id}`),
  getTypes: () => api.get('/items/types'),
  createType: (data: any) => api.post('/items/types', data),
  getQuantityTypes: () => api.get('/items/quantity-types'),
  createQuantityType: (data: any) => api.post('/items/quantity-types', data),
};

export const stocksAPI = {
  getAll: (params?: Record<string, any>) => api.get('/stocks', { params }),
  getStatus: () => api.get('/stocks/status'),
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
  getStatus: () => api.get('/sales/status'),
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
  getStatus: () => api.get('/accounts/status'),
  create: (data: any) => api.post('/accounts', data),
  update: (id: number, data: any) => api.put(`/accounts/${id}`, data),
  toggleState: (id: number, currentState: number) => api.put(`/accounts/${id}`, { state: currentState === 1 ? 0 : 1 }),
  delete: (id: number) => api.delete(`/accounts/${id}`),
};

// ─── DASHBOARD ───
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};

export const transactionsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/transactions', { params }),
  getStatus: () => api.get('/transactions/status'),
  getTrends: () => api.get('/transactions/trends'),
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
  getStatus: () => api.get('/production/status'),
};

export const productionAPI = {
  getBoms: bomsAPI.getAll,
};