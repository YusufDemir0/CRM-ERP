import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

/**
 * ErmayWeb sipariş talebi ↔ ERP satışı eşlemesi.
 * Birincil anahtar web'in Idempotency-Key değeridir; aynı talep tekrar gelirse
 * yeni cari/satış açılmaz, ilk sonuç döndürülür.
 */
@Entity('integration_web_orders')
export class WebOrderLink {
  @PrimaryColumn({ name: 'idempotency_key', type: 'varchar', length: 64 })
  idempotencyKey: string;

  @Column({ name: 'sale_id', type: 'bigint' })
  saleId: string;

  @Column({ name: 'party_id', type: 'bigint' })
  partyId: string;

  @Column({ name: 'department_id', type: 'bigint' })
  departmentId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
