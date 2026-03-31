import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../dto/finance.dto';
export declare class CurrenciesController {
    private readonly currenciesService;
    constructor(currenciesService: CurrenciesService);
    findAll(): Promise<import("./entities/currency.entity").Currency[]>;
    getDefault(): Promise<import("./entities/currency.entity").Currency>;
    findOne(id: number): Promise<import("./entities/currency.entity").Currency>;
    create(dto: CreateCurrencyDto, userId: number): Promise<import("./entities/currency.entity").Currency>;
    update(id: number, dto: UpdateCurrencyDto, userId: number): Promise<import("./entities/currency.entity").Currency>;
}
