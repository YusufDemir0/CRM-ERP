import { Decimal } from 'decimal.js';
export declare function parseTurkishDecimal(input: unknown): string | null;
export declare function transformDecimal({ value }: {
    value: unknown;
}): Decimal | string | undefined;
export declare function transformDecimalString({ value }: {
    value: unknown;
}): string | undefined;
