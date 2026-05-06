/**
 * Query Key Factory for centralized and type-safe cache management.
 * 
 * Pattern: [key, ...dependencies]
 * Use this to ensure consistent invalidation across the app.
 */

type QueryParams = Record<string, unknown>;

export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
  },
  parties: {
    all: (params: QueryParams) => ['parties', 'list', params] as const,
    detail: (id: number) => ['parties', 'detail', id] as const,
    lookup: ['parties', 'lookup'] as const,
  },
  items: {
    all: (params: QueryParams) => ['items', 'list', params] as const,
    detail: (id: number) => ['items', 'detail', id] as const,
    lookup: ['items', 'lookup'] as const,
  },
  stocks: {
    all: (params: QueryParams) => ['stocks', 'list', params] as const,
    movements: (itemId: string | number) => ['stocks', 'movements', itemId] as const,
  },
  sales: {
    all: (params: QueryParams) => ['sales', 'list', params] as const,
    detail: (id: string | number) => ['sales', 'detail', id] as const,
  },
  accounts: {
    all: (params: QueryParams) => ['accounts', 'list', params] as const,
    lookup: ['accounts', 'lookup'] as const,
  },
  transactions: {
    all: (params: QueryParams) => ['transactions', 'list', params] as const,
  },
  currencies: {
    all: ['currencies'] as const,
    allWithParams: (params: QueryParams) => ['currencies', 'list', params] as const,
  },
  boms: {
    all: (params: QueryParams) => ['boms', 'list', params] as const,
    active: ['boms', 'active'] as const,
    lookup: ['boms', 'active'] as const,
  },
  productionOrders: {
    all: (params: QueryParams) => ['production-orders', 'list', params] as const,
  },
  departments: {
    all: (params: QueryParams) => ['departments', 'list', params] as const,
    active: ['departments', 'active'] as const,
    lookup: ['departments', 'active'] as const,
  },
  logs: {
    all: (params: QueryParams) => ['logs', 'list', params] as const,
  },
  notes: {
    all: (params: QueryParams) => ['notes', 'list', params] as const,
  },
  roles: {
    all: (params: QueryParams) => ['roles', 'list', params] as const,
  },
  users: {
    all: (params: QueryParams) => ['users', 'list', params] as const,
  },
  permissions: {
    all: ['permissions'] as const,
  },
  settings: {
    base: ['settings'] as const,
    codeGroups: ['codeGroups'] as const,
    quantityTypes: ['quantityTypes'] as const,
    itemTypes: ['itemTypes'] as const,
    deptTypes: ['deptTypes'] as const,
    saleTypes: ['saleTypes'] as const,
  },
} as const;
