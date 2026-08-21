import { Repository } from 'typeorm';
import { Party } from './entities/party.entity';
import { CreatePartyDto, UpdatePartyDto, PartiesQueryDto, MovementsQueryDto, StatementEntry, MovementRow } from './dto/party.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CurrenciesService } from '../finance/currencies/currencies.service';
import { Decimal } from 'decimal.js';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
export declare class PartiesService {
    private partyRepo;
    private currenciesService;
    constructor(partyRepo: Repository<Party>, currenciesService: CurrenciesService);
    lookup(type?: string, currentUser?: JwtPayload): Promise<Partial<Party>[]>;
    findAll(query: PartiesQueryDto, currentUser?: JwtPayload): Promise<PaginatedResult<Party>>;
    findOne(id: string): Promise<Party>;
    create(dto: CreatePartyDto, userId: string): Promise<Party>;
    update(id: string, dto: UpdatePartyDto, userId: string, currentUser?: JwtPayload): Promise<Party>;
    softDelete(id: string): Promise<void>;
    getBalance(id: string): Promise<{
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
            id: string;
            name: string;
            balance: Decimal;
            limit: Decimal;
        }[];
    }>;
    getStatement(id: string): Promise<StatementEntry[]>;
    findAllMovements(query: MovementsQueryDto, currentUser: JwtPayload): Promise<PaginatedResult<MovementRow>>;
}
