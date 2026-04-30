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
  entryDate?: string;
  lastDeactivationDate?: string;
}

export interface DepartmentType extends BaseEntity {
  name: string;
}

export interface Department extends BaseEntity {
  name: string;
  description?: string;
  abbreviation?: string;
  departmentTypeId?: number;
  departmentType?: DepartmentType;
  commercialAccountId?: number;
  commercialAccount?: Account;
}

export interface Staff extends BaseEntity {
  firstName: string;
  lastName: string;
  phone?: string;
  entryDate?: string;
  lastDeactivationDate?: string;
  departmentId: number;
  department?: Department;
  isActive: boolean;
  tckn?: string;
}

export interface CreateStaffDto {
  firstName: string;
  lastName: string;
  phone?: string;
  entryDate?: string;
  departmentId: number;
  isActive?: boolean;
  tckn?: string;
}

export type UpdateStaffDto = Partial<CreateStaffDto>;

export interface Role extends BaseEntity {
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission extends BaseEntity {
  name: string;
  key: string;
  module: string;
  action?: string;
  description?: string;
}


export interface Currency extends BaseEntity {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: string; // DB-03: Decimal → JSON string
  isDefault: number;
}

export interface Party extends BaseEntity {
  name: string;
  type: 'customer' | 'supplier';
  phone1?: string | null;
  phone2?: string | null;
  taxNumber?: string | null;
  email?: string | null;
  address?: string | null;
  addressDetail?: string; // UI only
  cityId?: number | null;
  districtName?: string; // UI only
  balance: string; // DB-03: Decimal → JSON string
  creditLimit: string; // DB-03: Decimal → JSON string
  paymentTerms?: string | null;
  notes?: string | null;
  currencyId?: number | null;
  currency?: Currency;
}

export interface Account extends BaseEntity {
  name: string;
  bankName: string | null;
  iban: string | null;
  ibanName: string | null;
  currencyId: number | null;
  currency?: Currency;
  criticalLimit: string; // DB-03: Decimal → JSON string
  description: string | null;
}

export interface ItemType extends BaseEntity {
  name: string;
  abbreviation: string;
  isExcludedFromBom?: boolean;
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
  purchasePrice: string | null; // DB-03: Decimal → JSON string
  salePrice: string | null; // DB-03: Decimal → JSON string
  netPrice: string | null; // DB-03: Decimal → JSON string
  currencyId: number | null;
  currency?: Currency;
  quantityTypeId: number;
  quantityType?: QuantityType;
  totalStock?: number;
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
  exchangeRate: string; // DB-03: Decimal → JSON string
  totalAmount: string; // DB-03: Decimal → JSON string
  discountAmount: string; // DB-03: Decimal → JSON string
  discountPercent: string; // DB-03: Decimal → JSON string
  kdv: string; // DB-03: Decimal → JSON string
  grandTotal: string; // DB-03: Decimal → JSON string
  deposit: string; // DB-03: Decimal → JSON string
  status: 'draft' | 'approved' | 'shipped' | 'invoiced' | 'cancelled';
  notes?: string | null;
  phone?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  email?: string | null;
  source?: string | null;
  deliveryDate?: string | null;
  items?: SaleItem[];
}

export interface SaleItem extends BaseEntity {
  saleId: number;
  itemId: number;
  item?: Item;
  quantity: string; // DB-03: Decimal → JSON string
  price: string; // DB-03: Decimal → JSON string
  discountAmount: string; // DB-03: Decimal → JSON string
  discountPercent: string; // DB-03: Decimal → JSON string
  netPrice: string; // DB-03: Decimal → JSON string
  kdvRate: string; // DB-03: Decimal → JSON string
  kdvAmount: string; // DB-03: Decimal → JSON string
  lineTotal: string; // DB-03: Decimal → JSON string
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
  unitCost: string; // DB-03: Decimal → JSON string
  totalCost: string; // DB-03: Decimal → JSON string
  notes?: string | null;
}

export interface Transaction extends BaseEntity {
  code: string;
  partyId: number | null;
  party?: Party;
  commercialAccountId: number | null;
  commercialAccount?: Account;
  amount: string; // DB-03: Decimal → JSON string
  currencyId: number | null;
  currency?: Currency;
  exchangeRate: string; // DB-03: Decimal → JSON string
  type: 'in' | 'out';
  referenceType?: string;
  referenceId?: number;
  date: string;
  description?: string;
  status: 'completed' | 'cancelled';
}

export interface Log extends BaseEntity {
  module: string;
  action: string;
  message: string;
  tag: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | string;
  userId?: number;
  user?: User;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}


export interface Stock extends BaseEntity {
  itemId: number;
  item?: Item;
  departmentId: number;
  department?: Department;
  quantity: string; // DB-03: Decimal → JSON string
}

export interface StockMovement extends BaseEntity {
  stockId: number;
  itemId: number;
  item?: Item;
  departmentId: number;
  department?: Department;
  quantity: number;
  type: 'in' | 'out';
  referenceType?: string;
  referenceId?: number;
  description?: string;
  previousQuantity: number;
  newQuantity: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  state?: number;
  [key: string]: string | number | undefined; // For additional query filters
}

// ────── UTILITY TYPES ──────

/** Type-safe sortable column key extraction (replaces index signature hack) */
export type SortableColumn<T> = keyof T & string;

// ────── API REQUEST DTOs ──────

export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId?: number;
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'password'>> {
  state?: number;
  password?: string;
}

export interface CreatePartyDto {
  name: string;
  type: 'customer' | 'provider' | 'both';
  phone1?: string;
  phone2?: string;
  taxNumber?: string;
  email?: string;
  address?: string;
  creditLimit?: string | number;
  paymentTerms?: string;
  notes?: string;
  currencyId?: number;
}

export type UpdatePartyDto = Partial<CreatePartyDto> & { state?: number };

export interface CreateTransactionDto {
  partyId?: number;
  commercialAccountId?: number;
  amount: string | number;
  currencyId?: number;
  type: 'in' | 'out';
  referenceType?: string;
  referenceId?: number;
  date: string;
  description?: string;
}

export interface StockAdjustmentDto {
  itemId: number;
  departmentId: number;
  quantity: string | number;
  type: 'in' | 'out';
  description?: string;
  notes?: string;
}

export interface StockTransferDto {
  itemId: number;
  fromDepartmentId: number;
  toDepartmentId: number;
  quantity: string | number;
  description?: string;
}

export interface Note extends BaseEntity {
  title: string;
  content: string;
  color?: string;
}

export interface CreateNoteDto {
  title?: string;
  content: string;
  color?: string;
}

export type UpdateNoteDto = Partial<CreateNoteDto>;

export interface CreateSaleItemDto {
  itemId: number;
  quantity: string | number;
  price: string | number;
  discountAmount?: string | number;
  discountPercent?: string | number;
  kdvRate?: string | number;
  description?: string;
}

export interface CreateSaleDto {
  partyId: number;
  saleTypeId: number;
  currencyId?: number;
  deliveryDate?: string;
  deposit?: string | number;
  discountAmount?: string | number;
  discountPercent?: string | number;
  items: CreateSaleItemDto[];
  notes?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  email?: string;
  source?: string;
}

export interface ProductionOrderFormData {
  bomId: string | number;
  plannedQuantity: string | number;
  producedQuantity: string | number;
  wastageQuantity: string | number;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  sourceDepartmentId: string | number;
  targetDepartmentId: string | number;
  startDate: string;
  endDate: string;
  notes: string;
}

// ────── SALES WIZARD TYPES ──────

export interface CartItem {
  item: Item;
  qty: number | string;
  price: number | string;
  discountValue: number | string;
  discountType: 'amount' | 'percent';
  kdvRate: number | string;
  maxQtyDesc?: number;
}

export interface SalesWizardState {
  step: number;
  partyId: string;
  customerSearch: string;
  isCustomerDropdownOpen: boolean;
  saleTypeId: string;
  currencyId: string;
  deliveryDate: string;
  repId: string;
  invoiceType: 'billed' | 'unbilled' | null;
  cart: CartItem[];
  searchTerm: string;
  genDiscountType: 'amount' | 'percent';
  genDiscountValue: string;
  deposit: string;
  saleNotes: string;
  // New fields for the single-page wizard
  contactPhone1: string;
  contactPhone2: string;
  contactEmail: string;
  contactTaxId: string;
  leadSource: string;
  addressType: 'same' | 'new';
  cityId: string;
  cityName: string;
  districtName: string;
  addressDetail: string;
  isPartyModalOpen: boolean;
}
