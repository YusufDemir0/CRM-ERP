import api from './core';
import { AxiosRequestConfig } from 'axios';

export const vehiclesAPI = {
  getAll: (config?: AxiosRequestConfig) => api.get('/vehicles', config),
  create: (data: { name: string; plate: string; description?: string }, config?: AxiosRequestConfig) => api.post('/vehicles', data, config),
  delete: (id: string | number, config?: AxiosRequestConfig) => api.delete(`/vehicles/${id}`, config),
};
