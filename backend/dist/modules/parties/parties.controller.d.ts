import { PartiesService } from './parties.service';
import { CreatePartyDto, UpdatePartyDto, PartiesQueryDto } from './dto/party.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { MovementsQueryDto } from './dto/party.dto';
export declare class PartiesController {
    private readonly partiesService;
    constructor(partiesService: PartiesService);
    findAll(query: PartiesQueryDto, user: JwtPayload): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/party.entity").Party>>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        totalReceivable: string;
        exposurePercentage: number;
        atRiskCount: number;
    }>;
    findAllMovements(query: MovementsQueryDto, user: JwtPayload): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./dto/party.dto").MovementRow>>;
    lookup(type?: string, user?: JwtPayload): Promise<Partial<import("./entities/party.entity").Party>[]>;
    findOne(id: string): Promise<import("./entities/party.entity").Party>;
    getBalance(id: string): Promise<{
        balance: string;
        creditLimit: string;
        currency: string;
        symbol: string;
    }>;
    getStatement(id: string): Promise<import("./dto/party.dto").StatementEntry[]>;
    create(dto: CreatePartyDto, userId: string): Promise<import("./entities/party.entity").Party>;
    update(id: string, dto: UpdatePartyDto, user: JwtPayload): Promise<import("./entities/party.entity").Party>;
    remove(id: string): Promise<void>;
}
