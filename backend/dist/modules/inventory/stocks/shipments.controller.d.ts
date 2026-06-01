import { ShipmentsService } from './shipments.service';
import { DispatchShipmentDto, ShipmentsQueryDto } from './dto/shipment.dto';
import { Response } from 'express';
export declare class ShipmentsController {
    private readonly shipmentsService;
    constructor(shipmentsService: ShipmentsService);
    findAll(query: ShipmentsQueryDto): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/shipment.entity").Shipment>>;
    getMetrics(): Promise<{
        statusCounts: {
            pending: number;
            shipped: number;
            completed: number;
            cancelled: number;
        };
        routePooling: {
            deliveryCity: any;
            deliveryDistrict: any;
            count: number;
        }[];
    }>;
    exportExcel(query: ShipmentsQueryDto, res: Response): Promise<void>;
    findOne(id: string): Promise<import("./entities/shipment.entity").Shipment>;
    dispatch(id: string, dto: DispatchShipmentDto, userId: string): Promise<import("./entities/shipment.entity").Shipment>;
    complete(id: string, userId: string): Promise<import("./entities/shipment.entity").Shipment>;
    cancel(id: string, userId: string): Promise<import("./entities/shipment.entity").Shipment>;
}
