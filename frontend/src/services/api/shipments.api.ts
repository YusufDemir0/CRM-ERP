import api from './core';
import { AxiosRequestConfig } from 'axios';

export const shipmentsAPI = {
  getAll: (params?: any, config?: AxiosRequestConfig) => api.get('/shipments', { params, ...config }),
  getOne: (id: string | number, config?: AxiosRequestConfig) => api.get(`/shipments/${id}`, config),
  getMetrics: (config?: AxiosRequestConfig) => api.get('/shipments/metrics', config),
  dispatch: (id: string | number, data: { carrierNameOrPlate: string }, config?: AxiosRequestConfig) => api.post(`/shipments/${id}/dispatch`, data, config),
  complete: (id: string | number, config?: AxiosRequestConfig) => api.post(`/shipments/${id}/complete`, config),
  cancel: (id: string | number, config?: AxiosRequestConfig) => api.post(`/shipments/${id}/cancel`, config),
  exportExcel: (params?: any) => {
    return api.get('/shipments/export-excel', {
      params,
      responseType: 'blob',
    });
  },
};
