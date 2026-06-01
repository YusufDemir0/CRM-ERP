import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Sale } from './sale.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('sales_installments')
export class SaleInstallment extends BaseEntity {
  @Index()
  @Column({ name: 'sale_id', type: 'bigint' })
  saleId: string;

  @Column({ name: 'installment_no', type: 'int' })
  installmentNo: number;

  @Index()
  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  amount: Decimal = new Decimal(0);

  @Column({ name: 'payment_status', type: 'varchar', length: 20, default: 'pasif' })
  paymentStatus: string; // 'pasif' or 'aktif' (default 'pasif')

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;
}
