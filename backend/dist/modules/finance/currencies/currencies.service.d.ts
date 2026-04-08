import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../dto/finance.dto';
export declare class CurrenciesService {
    private currencyRepo;
    constructor(currencyRepo: Repository<Currency>);
    findAll(): Promise<Currency[]>;
    findOne(id: number): Promise<Currency>;
    create(dto: CreateCurrencyDto, userId?: number): Promise<Currency>;
    update(id: number, dto: UpdateCurrencyDto, userId?: number): Promise<Currency>;
    getDefault(): Promise<Currency>;
    setDefault(id: number): Promise<Currency>;
    delete(id: number): Promise<void>;
}
