import { ValueTransformer } from 'typeorm';
import { Decimal } from 'decimal.js';
export declare class DecimalTransformer implements ValueTransformer {
    to(value: Decimal | number | string | null): string | null;
    from(value: string | null): Decimal | null;
}
