import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../dto/finance.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CurrenciesController {
    private readonly currenciesService;
    constructor(currenciesService: CurrenciesService);
    findAll(query: PaginationDto): Promise<any>;
    getDefault(): Promise<import("./entities/currency.entity").Currency>;
    findOne(id: number): Promise<import("./entities/currency.entity").Currency>;
    create(dto: CreateCurrencyDto, userId: number): Promise<import("./entities/currency.entity").Currency>;
    update(id: number, dto: UpdateCurrencyDto, userId: number): Promise<import("./entities/currency.entity").Currency>;
    setDefault(id: number): Promise<import("./entities/currency.entity").Currency>;
    remove(id: number): Promise<void>;
}
