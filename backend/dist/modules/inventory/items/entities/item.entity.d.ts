import { BaseEntity } from '../../../../common/entities/base.entity';
import { ItemType } from './item-type.entity';
import { Party } from '../../../parties/entities/party.entity';
import { Currency } from '../../../finance/currencies/entities/currency.entity';
import { QuantityType } from './quantity-type.entity';
export declare class Item extends BaseEntity {
    name: string;
    itemTypeId: number;
    code: string;
    providerId: number | null;
    criticalLimit: number;
    image: string | null;
    purchasePrice: number | null;
    salePrice: number | null;
    netPrice: number | null;
    currencyId: number | null;
    quantityTypeId: number;
    kdv: number;
    description: string | null;
    notes: string | null;
    itemType: ItemType;
    provider: Party;
    currency: Currency;
    quantityType: QuantityType;
}
