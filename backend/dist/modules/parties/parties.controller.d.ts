import { PartiesService } from './parties.service';
import { CreatePartyDto, UpdatePartyDto } from './dto/party.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class PartiesController {
    private readonly partiesService;
    constructor(partiesService: PartiesService);
    findAll(query: PaginationDto & {
        type?: string;
    }): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/party.entity").Party>>;
    findOne(id: number): Promise<import("./entities/party.entity").Party>;
    getBalance(id: number): Promise<{
        balance: number;
        creditLimit: number;
        available: number;
    }>;
    create(dto: CreatePartyDto, userId: number): Promise<import("./entities/party.entity").Party>;
    update(id: number, dto: UpdatePartyDto, userId: number): Promise<import("./entities/party.entity").Party>;
    remove(id: number): Promise<void>;
}
