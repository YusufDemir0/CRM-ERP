import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Sale } from './sale.entity';
export declare class SaleInstallment extends BaseEntity {
    saleId: string;
    installmentNo: number;
    dueDate: string;
    amount: Decimal;
    paymentStatus: string;
    sale: Sale;
}
