import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.method &&['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
    window.dispatchEvent(new CustomEvent('show-loader'));
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.method &&['post', 'put', 'delete'].includes(response.config.method.toLowerCase())) {
      window.dispatchEvent(new Event('hide-loader'));
      
      if (response.config.url && !response.config.url.includes('/auth/login')) {
        toast.success("İşlem Başarılı!"); // Çirkin alert() yerine modern toast mesajı
        // Sayfa yenilemesi kaldırıldı — React state ile güncelleme yapılmalı
      }
    }
    return response;
  },
  (error) => {
    window.dispatchEvent(new Event('hide-loader'));

    // GİZLİ KALAN 400 ve 500 HATALARININ KULLANICIYA YANSITILMASI
    if (error.response && error.response.status !== 401) {
      let outputMessage = 'Sistemsel bir hata oluştu.';
      
      const data = error.response.data;
      if (data) {
        if (typeof data === 'string') {
          outputMessage = data;
        } else if (data.message) {
          outputMessage = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
        } else if (data.error) {
          outputMessage = String(data.error);
          if (data.detail) outputMessage += ` - ${data.detail}`;
        } else {
          try {
            outputMessage = JSON.stringify(data);
          } catch (e) {
            outputMessage = 'Bilinmeyen hata formatı';
          }
        }
      }
      
      // Ensure it's absolutely a string
      toast.error(String(outputMessage));
    }

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

export const authAPI = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
};

export const usersAPI = {
  getAll: (params?: Record<string, any>) => api.get('/users', { params }),
  getOne: (id: number) => api.get(`/users/${id}`),
  getStatus: () => api.get('/users/status'),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  toggleState: (id: number, currentState: number) => api.put(`/users/${id}`, { state: currentState === 1 ? 0 : 1 }),
  delete: (id: number) => api.delete(`/users/${id}`),
};

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

export const itemsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/items', { params }),
  getOne: (id: number) => api.get(`/items/${id}`),
  getStatus: () => api.get('/items/status'),
  create: (data: any) => api.post('/items', data),
  update: (id: number, data: any) => api.put(`/items/${id}`, data),
  toggleState: (id: number, currentState: number) => api.put(`/items/${id}`, { state: currentState === 1 ? 0 : 1 }),
  delete: (id: number) => api.delete(`/items/${id}`),
  findAllItemTypes: () => api.get('/items/types'),
  getTypes: () => api.get('/items/types'),
  createItemType: (data: any) => api.post('/items/types', data),
  updateItemType: (id: number, data: any) => api.put(`/items/types/${id}`, data),
  deleteItemType: (id: number) => api.delete(`/items/types/${id}`),
  getCodeGroups: () => api.get('/items/code-groups'),
  createCodeGroup: (data: any) => api.post('/items/code-groups', data),
  updateCodeGroup: (id: number, data: any) => api.put(`/items/code-groups/${id}`, data),
  deleteCodeGroup: (id: number) => api.delete(`/items/code-groups/${id}`),
  getQuantityTypes: () => api.get('/items/quantity-types'),
  createQuantityType: (data: any) => api.post('/items/quantity-types', data),
};

export const stocksAPI = {
  getAll: (params?: Record<string, any>) => api.get('/stocks', { params }),
  getStatus: () => api.get('/stocks/status'),
  getCritical: () => api.get('/stocks/critical'),
  getMovements: (stockId: number, params?: Record<string, any>) => api.get(`/stocks/${stockId}/movements`, { params }),
  adjust: (data: any) => api.post('/stocks/adjust', data),
  transfer: (data: any) => api.post('/stocks/transfer', data), // YENİ EKLENDİ
};

export const salesAPI = {
  getAll: (params?: Record<string, any>) => api.get('/sales', { params }),
  getOne: (id: number) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  update: (id: number, data: any) => api.put(`/sales/${id}`, data),
  approve: (id: number, data: { departmentId: number; commercialAccountId?: number }) => api.post(`/sales/${id}/approve`, data),
  cancel: (id: number) => api.post(`/sales/${id}/cancel`),
  delete: (id: number) => api.delete(`/sales/${id}`),
  getTypes: () => api.get('/sales/types'),
  getStatus: () => api.get('/sales/status'),
};

export const currenciesAPI = {
  getAll: (params?: any) => api.get('/currencies', { params }),
  getDefault: () => api.get('/currencies/default'),
  create: (data: any) => api.post('/currencies', data),
  update: (id: number, data: any) => api.put(`/currencies/${id}`, data),
  setDefault: (id: number) => api.put(`/currencies/${id}/default`),
  delete: (id: number) => api.delete(`/currencies/${id}`),
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

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};

export const transactionsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/transactions', { params }),
  getStatus: () => api.get('/transactions/status'),
  getTrends: () => api.get('/transactions/trends'),
  getOne: (id: number) => api.get(`/transactions/${id}`),
  create: (data: any) => api.post('/transactions', data),
  cancel: (id: number) => api.post(`/transactions/${id}/cancel`), // YENİ: İptal Servisi Eklendi
};

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

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByKey: (key: string) => api.get(`/settings/${key}`),
  updateByKey: (key: string, value: string) => api.put(`/settings/${key}`, { settingKey: key, settingValue: value }),
  bulkUpdate: (settings: { settingKey: string; settingValue: string }[]) => api.put('/settings', { settings }),
};

export const logsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/logs', { params }),
};

export const notesAPI = {
  getAll: () => api.get('/notes'),
  create: (data: any) => api.post('/notes', data),
  update: (id: number, data: any) => api.put(`/notes/${id}`, data),
  delete: (id: number) => api.delete(`/notes/${id}`),
};