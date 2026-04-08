import { BaseEntity } from '../../../common/entities/base.entity';
import { Party } from '../../parties/entities/party.entity';
import { SaleType } from './sale-type.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';
import { SaleItem } from './sale-item.entity';
export declare class Sale extends BaseEntity {
    code: string;
    partyId: number;
    saleTypeId: number;
    currencyId: number | null;
    exchangeRate: number;
    deliveryDate: string | null;
    status: 'draft' | 'approved' | 'shipped' | 'invoiced' | 'cancelled';
    deposit: number;
    totalAmount: number;
    discountAmount: number;
    discountPercent: number;
    kdv: number;
    grandTotal: number;
    notes: string | null;
    party: Party;
    saleType: SaleType;
    currency: Currency;
    items: SaleItem[];
}
