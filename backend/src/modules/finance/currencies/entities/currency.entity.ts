import { Entity, Column, Unique } from 'typeorm';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { DecimalTransformer } from '../../../../common/transformers/decimal.transformer';

@Entity('currencies')
@Unique(['code'])
export class Currency extends BaseEntity {
  @Column({ type: 'char', length: 3 })
  code: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  symbol: string;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: 1, transformer: new DecimalTransformer() })
  exchangeRate: Decimal;

  @Column({ name: 'is_default', type: 'tinyint', default: 0 })
  isDefault: number;
}

