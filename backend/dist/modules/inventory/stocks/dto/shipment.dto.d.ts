import { PaginationDto } from '../../../../common/dto/pagination.dto';
export declare class CreateShipmentDto {
    saleId: string;
    outgoingDepartmentId: string;
    deliveryCity: string;
    deliveryDistrict: string;
    deliveryAddress: string;
    deadline: string;
}
export declare class UpdateShipmentDto {
    deliveryCity?: string;
    deliveryDistrict?: string;
    deliveryAddress?: string;
    carrierNameOrPlate?: string;
    deadline?: string;
    status?: 'pending' | 'shipped' | 'completed' | 'cancelled';
}
export declare class DispatchShipmentDto {
    carrierNameOrPlate?: string;
}
export declare class ShipmentsQueryDto extends PaginationDto {
    status?: string;
    today?: string;
    city?: string;
    district?: string;
}
