import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { Sale } from '../../../sales/entities/sale.entity';
import { Department } from '../../../departments/entities/department.entity';
import { Vehicle } from './vehicle.entity';
import { Staff } from '../../../staff/entities/staff.entity';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'sale_id', type: 'bigint' })
  saleId: string;

  @Index()
  @Column({ name: 'outgoing_department_id', type: 'bigint' })
  outgoingDepartmentId: string;

  @Column({ name: 'delivery_city', type: 'varchar', length: 255 })
  deliveryCity: string;

  @Column({ name: 'delivery_district', type: 'varchar', length: 255 })
  deliveryDistrict: string;

  @Column({ name: 'delivery_address', type: 'text' })
  deliveryAddress: string;

  @Column({ name: 'carrier_name_or_plate', type: 'varchar', length: 255, nullable: true })
  carrierNameOrPlate: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'shipped', 'completed', 'cancelled'],
    default: 'pending'
  })
  status: 'pending' | 'shipped' | 'completed' | 'cancelled';

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'date' })
  deadline: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'outgoing_department_id' })
  outgoingDepartment: Department;

  @ManyToMany(() => Vehicle)
  @JoinTable({
    name: 'shipment_vehicles',
    joinColumn: { name: 'shipment_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'vehicle_id', referencedColumnName: 'id' }
  })
  vehicles: Vehicle[];

  @ManyToMany(() => Staff)
  @JoinTable({
    name: 'shipment_staff',
    joinColumn: { name: 'shipment_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'staff_id', referencedColumnName: 'id' }
  })
  assignedStaff: Staff[];
}

