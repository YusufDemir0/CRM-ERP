import { QueryRunner } from 'typeorm';
export declare class SequenceGeneratorService {
    private readonly logger;
    generateItemCode(queryRunner: QueryRunner, itemTypeId: number): Promise<string>;
    generateSaleCode(queryRunner: QueryRunner, saleTypeId: number): Promise<string>;
    generateProductionCode(queryRunner: QueryRunner, prefix?: string): Promise<string>;
    generateTransactionCode(queryRunner: QueryRunner, prefix: string): Promise<string>;
}
