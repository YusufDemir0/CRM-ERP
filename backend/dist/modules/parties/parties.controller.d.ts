import { PartiesService } from './parties.service';
import { CreatePartyDto, UpdatePartyDto, PartiesQueryDto } from './dto/party.dto';
export declare class PartiesController {
    private readonly partiesService;
    constructor(partiesService: PartiesService);
    findAll(query: PartiesQueryDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/party.entity").Party>>;
    findOne(id: number): Promise<import("./entities/party.entity").Party>;
    getBalance(id: number): Promise<{
        balance: number;
        creditLimitPlus: number;
        creditLimitMinus: number;
        available: number;
    }>;
    create(dto: CreatePartyDto, userId: number): Promise<import("./entities/party.entity").Party>;
    update(id: number, dto: UpdatePartyDto, userId: number): Promise<import("./entities/party.entity").Party>;
    remove(id: number): Promise<void>;
}
