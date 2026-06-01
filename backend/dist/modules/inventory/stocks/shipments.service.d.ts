import { StreamableFile } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto, DispatchShipmentDto, ShipmentsQueryDto } from './dto/shipment.dto';
import { StocksTransactionsService } from './stocks-transactions.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { LogsService } from '../../logs/logs.service';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
export declare class ShipmentsService {
    private readonly shipmentRepo;
    private readonly stocksTransactionsService;
    private readonly transactionContext;
    private readonly logsService;
    constructor(shipmentRepo: Repository<Shipment>, stocksTransactionsService: StocksTransactionsService, transactionContext: TransactionContextService, logsService: LogsService);
    findAll(query: ShipmentsQueryDto): Promise<PaginatedResult<Shipment>>;
    findOne(id: string): Promise<Shipment>;
    create(dto: CreateShipmentDto, userId: string): Promise<Shipment>;
    dispatch(id: string, dto: DispatchShipmentDto, userId: string): Promise<Shipment>;
    complete(id: string, userId: string): Promise<Shipment>;
    cancel(id: string, userId: string): Promise<Shipment>;
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
    exportToExcel(query: ShipmentsQueryDto): Promise<StreamableFile>;
}
