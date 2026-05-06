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
} from '../../types';
import { authEvents } from '../authEvents';
import { useLoaderStore } from '../../store/useLoaderStore';

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

const processQueue = (error: unknown) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
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
        const originalRequest = config as AxiosRequestConfig & { _retry?: boolean };
        const isAuthRequest = config?.url?.includes('/auth/login') || 
                            config?.url?.includes('/auth/refresh');
        
        if (config?.url && !isAuthRequest && !originalRequest._retry) {
          if (isRefreshing) {
            // Queue parallel requests until refresh completes
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then(() => api(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;
          
          return api.post('/auth/refresh')
            .then(() => {
              processQueue(null);
              return api(originalRequest);
            })
            .catch((refreshError: unknown) => {
              processQueue(refreshError);
              authEvents.emit('session-expired');
              return Promise.reject(refreshError);
            })
            .finally(() => {
              isRefreshing = false;
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
