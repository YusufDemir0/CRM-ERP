import { Repository } from 'typeorm';
import { Party } from './entities/party.entity';
import { CreatePartyDto, UpdatePartyDto } from './dto/party.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { CurrenciesService } from '../finance/currencies/currencies.service';
import { Decimal } from 'decimal.js';
export declare class PartiesService {
    private partyRepo;
    private currenciesService;
    constructor(partyRepo: Repository<Party>, currenciesService: CurrenciesService);
    findAll(query: PaginationDto & {
        type?: string;
        departmentId?: number;
    }): Promise<PaginatedResult<Party>>;
    findOne(id: number): Promise<Party>;
    create(dto: CreatePartyDto, userId?: number): Promise<Party>;
    update(id: number, dto: UpdatePartyDto, userId?: number): Promise<Party>;
    softDelete(id: number): Promise<void>;
    getBalance(id: number): Promise<{
        balance: string;
        creditLimit: string;
        currency: string;
        symbol: string;
    }>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        totalReceivable: string;
        exposurePercentage: number;
        atRiskCount: number;
    }>;
    getGlobalExposure(): Promise<{
        totalReceivable: string;
        totalCreditLimit: string;
        exposurePercentage: number;
    }>;
    getHealthMetrics(): Promise<{
        healthyCount: number;
        atRiskCount: number;
        requiresAttention: {
            id: number;
            name: string;
            balance: Decimal;
            limit: Decimal;
        }[];
    }>;
}
