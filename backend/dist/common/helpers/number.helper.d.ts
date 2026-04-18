import { Decimal } from 'decimal.js';
export declare function parseTurkishDecimal(input: any): string | null;
export declare function transformDecimal({ value }: {
    value: any;
}): Decimal | string | undefined;
export declare function transformDecimalString({ value }: {
    value: any;
}): string | undefined;
