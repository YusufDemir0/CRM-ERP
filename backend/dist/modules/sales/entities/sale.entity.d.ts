import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Party } from '../../parties/entities/party.entity';
import { SaleType } from './sale-type.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';
import { SaleItem } from './sale-item.entity';
export declare class Sale extends BaseEntity {
    code: string;
    partyId: number;
    saleTypeId: number;
    departmentId: number | null;
    currencyId: number | null;
    exchangeRate: Decimal;
    deliveryDate: string | null;
    status: 'draft' | 'approved' | 'shipped' | 'invoiced' | 'cancelled';
    deposit: Decimal;
    totalAmount: Decimal;
    discountAmount: Decimal;
    discountPercent: Decimal;
    kdv: Decimal;
    grandTotal: Decimal;
    notes: string | null;
    party: Party;
    saleType: SaleType;
    currency: Currency;
    items: SaleItem[];
}
