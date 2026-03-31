import { Repository } from 'typeorm';
import { Party } from './entities/party.entity';
import { CreatePartyDto, UpdatePartyDto } from './dto/party.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
export declare class PartiesService {
    private partyRepo;
    constructor(partyRepo: Repository<Party>);
    findAll(query: PaginationDto & {
        type?: string;
    }): Promise<PaginatedResult<Party>>;
    findOne(id: number): Promise<Party>;
    create(dto: CreatePartyDto, userId?: number): Promise<Party>;
    update(id: number, dto: UpdatePartyDto, userId?: number): Promise<Party>;
    softDelete(id: number): Promise<void>;
    getBalance(id: number): Promise<{
        balance: number;
        creditLimit: number;
        available: number;
    }>;
}
