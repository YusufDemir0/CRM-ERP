import { PartiesService } from './parties.service';
import { CreatePartyDto, UpdatePartyDto, PartiesQueryDto } from './dto/party.dto';
export declare class PartiesController {
    private readonly partiesService;
    constructor(partiesService: PartiesService);
    findAll(query: PartiesQueryDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/party.entity").Party>>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        totalReceivable: number;
        exposurePercentage: number;
        atRiskCount: number;
    }>;
    findOne(id: number): Promise<import("./entities/party.entity").Party>;
    getBalance(id: number): Promise<{
        balance: number;
        creditLimit: number;
        currency: string;
        symbol: string;
    }>;
    create(dto: CreatePartyDto, userId: number): Promise<import("./entities/party.entity").Party>;
    update(id: number, dto: UpdatePartyDto, userId: number): Promise<import("./entities/party.entity").Party>;
    remove(id: number): Promise<void>;
}
