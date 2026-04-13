export interface BaseEntity {
  id: number;
  state: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  deletedAt?: string | null;
}

export interface User extends BaseEntity {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId?: number;
  department?: Department;
  roles?: Role[];
  failedLoginAttempts?: number;
}

export interface Department extends BaseEntity {
  name: string;
  description?: string;
}

export interface Role extends BaseEntity {
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission extends BaseEntity {
  name: string;
  key: string;
  module: string;
  description?: string;
}

export interface Currency extends BaseEntity {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: number;
}

export interface Party extends BaseEntity {
  [key: string]: any; // Index signature for sorting
  name: string;
  type: 'customer' | 'provider' | 'both';
  phone1?: string | null;
  phone2?: string | null;
  taxNumber?: string | null;
  email?: string | null;
  address?: string | null;
  addressDetail?: string; // UI only
  districtName?: string; // UI only
  balance: number;
  creditLimitPlus: number;
  creditLimitMinus: number;
  paymentTerms?: string | null;
  notes?: string | null;
  currencyId?: number | null;
  currency?: Currency;
}

export interface ItemType extends BaseEntity {
  name: string;
}

export interface ItemCodeGroup extends BaseEntity {
  name: string;
  prefix: string;
}

export interface QuantityType extends BaseEntity {
  name: string;
  abbreviation: string;
}

export interface Item extends BaseEntity {
  [key: string]: any; // Index signature for sorting
  name: string;
  itemTypeId: number;
  itemType?: ItemType;
  itemCodeGroupId: number | null;
  itemCodeGroup?: ItemCodeGroup;
  code: string;
  code1?: string | null;
  code2?: string | null;
  criticalLimit: number;
  image?: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
  netPrice: number | null;
  currencyId: number | null;
  currency?: Currency;
  quantityTypeId: number;
  quantityType?: QuantityType;
  kdv: number;
  description?: string | null;
  notes?: string | null;
  providerId?: number | null;
  provider?: Party;
}

export interface SaleType extends BaseEntity {
  name: string;
  abbreviation: string;
}

export interface Sale extends BaseEntity {
  code: string;
  partyId: number;
  party?: Party;
  saleTypeId: number;
  saleType?: SaleType;
  currencyId: number | null;
  currency?: Currency;
  exchangeRate: number;
  totalAmount: number;
  discountAmount: number;
  discountPercent: number;
  kdv: number;
  grandTotal: number;
  deposit: number;
  status: 'draft' | 'approved' | 'shipped' | 'invoiced' | 'cancelled';
  notes?: string | null;
  deliveryDate?: string | null;
  items?: SaleItem[];
}

export interface SaleItem extends BaseEntity {
  saleId: number;
  itemId: number;
  item?: Item;
  quantity: number;
  price: number;
  discountAmount: number;
  discountPercent: number;
  netPrice: number;
  kdvRate: number;
  kdvAmount: number;
  lineTotal: number;
  description?: string;
}

export interface BomItem extends BaseEntity {
  bomId: number;
  bom?: Bom;
  itemId: number;
  item?: Item;
  quantity: number;
  description?: string | null;
}

export interface Bom extends BaseEntity {
  name: string;
  targetItemId: number | null;
  targetItem?: Item;
  description?: string | null;
  version: number;
  isActive: boolean;
  items?: BomItem[];
}

export interface ProductionOrder extends BaseEntity {
  code: string;
  bomId: number;
  bom?: Bom;
  plannedQuantity: number;
  producedQuantity: number;
  wastageQuantity: number;
  sourceDepartmentId: number | null;
  sourceDepartment?: Department;
  targetDepartmentId: number | null;
  targetDepartment?: Department;
  startDate?: string | null;
  endDate?: string | null;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  unitCost: number;
  totalCost: number;
  notes?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
