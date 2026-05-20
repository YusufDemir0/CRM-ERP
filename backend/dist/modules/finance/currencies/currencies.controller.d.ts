import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../dto/finance.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CurrenciesController {
    private readonly currenciesService;
    constructor(currenciesService: CurrenciesService);
    findAll(query: PaginationDto): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/currency.entity").Currency>>;
    getDefault(): Promise<import("./entities/currency.entity").Currency>;
    findOne(id: string): Promise<import("./entities/currency.entity").Currency>;
    create(dto: CreateCurrencyDto, userId: string): Promise<import("./entities/currency.entity").Currency>;
    update(id: string, dto: UpdateCurrencyDto, userId: string): Promise<import("./entities/currency.entity").Currency>;
    setDefault(id: string): Promise<import("./entities/currency.entity").Currency>;
    remove(id: string): Promise<void>;
}
