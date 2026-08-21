import { Sale } from '../../../sales/entities/sale.entity';
import { Department } from '../../../departments/entities/department.entity';
import { Vehicle } from './vehicle.entity';
import { Staff } from '../../../staff/entities/staff.entity';
export declare class Shipment {
    id: string;
    saleId: string;
    outgoingDepartmentId: string;
    deliveryCity: string;
    deliveryDistrict: string;
    deliveryAddress: string;
    carrierNameOrPlate: string | null;
    status: 'pending' | 'shipped' | 'completed' | 'cancelled';
    approvedAt: Date | null;
    deadline: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    sale: Sale;
    outgoingDepartment: Department;
    vehicles: Vehicle[];
    assignedStaff: Staff[];
}
