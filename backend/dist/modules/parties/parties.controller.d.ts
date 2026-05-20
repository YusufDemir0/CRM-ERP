import { PartiesService } from './parties.service';
import { CreatePartyDto, UpdatePartyDto, PartiesQueryDto } from './dto/party.dto';
export declare class PartiesController {
    private readonly partiesService;
    constructor(partiesService: PartiesService);
    findAll(query: PartiesQueryDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/party.entity").Party>>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        totalReceivable: string;
        exposurePercentage: number;
        atRiskCount: number;
    }>;
    lookup(type?: string): Promise<Partial<import("./entities/party.entity").Party>[]>;
    findOne(id: string): Promise<import("./entities/party.entity").Party>;
    getBalance(id: string): Promise<{
        balance: string;
        creditLimit: string;
        currency: string;
        symbol: string;
    }>;
    create(dto: CreatePartyDto, userId: string): Promise<import("./entities/party.entity").Party>;
    update(id: string, dto: UpdatePartyDto, userId: string): Promise<import("./entities/party.entity").Party>;
    remove(id: string): Promise<void>;
}
