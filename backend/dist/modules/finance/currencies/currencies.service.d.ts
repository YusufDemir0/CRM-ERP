import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../dto/finance.dto';
export declare class CurrenciesService {
    private currencyRepo;
    constructor(currencyRepo: Repository<Currency>);
    findAll(query: import('../../../common/dto/pagination.dto').PaginationDto): Promise<import('../../../common/dto/pagination.dto').PaginatedResult<Currency>>;
    findOne(id: string): Promise<Currency>;
    create(dto: CreateCurrencyDto, userId: string): Promise<Currency>;
    update(id: string, dto: UpdateCurrencyDto, userId: string): Promise<Currency>;
    getDefault(): Promise<Currency>;
    setDefault(id: string): Promise<Currency>;
    delete(id: string): Promise<void>;
}
