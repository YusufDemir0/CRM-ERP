import { ValueTransformer } from 'typeorm';
import { Decimal } from 'decimal.js';

/**
 * TypeORM Transformer to handle Decimal.js objects for DECIMAL columns.
 * Prevents floating point issues and ensures precise financial calculations.
 */
export class DecimalTransformer implements ValueTransformer {
  /**
   * Transforms the object value to a value that is stored in the database. (Object -> DB)
   */
  to(value: Decimal | number | string | null): string | null {
    if (value === null || value === undefined) return null;
    return value.toString();
  }

  /**
   * Transforms the value from the database into the object property value. (DB -> Object)
   */
  from(value: string | null): Decimal | null {
    if (value === null || value === undefined) return null;
    return new Decimal(value);
  }
}
