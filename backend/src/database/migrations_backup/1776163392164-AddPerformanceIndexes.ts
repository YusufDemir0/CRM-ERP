import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceIndexes1776163392164 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Transactions Indexes
        await queryRunner.query(`CREATE INDEX idx_transactions_date ON transactions(date)`);
        await queryRunner.query(`CREATE INDEX idx_transactions_type ON transactions(type)`);
        await queryRunner.query(`CREATE INDEX idx_transactions_status ON transactions(status)`);
        await queryRunner.query(`CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id)`);

        // Parties Indexes
        await queryRunner.query(`CREATE INDEX idx_parties_name ON parties(name)`);
        await queryRunner.query(`CREATE INDEX idx_parties_type ON parties(type)`);
        await queryRunner.query(`CREATE INDEX idx_parties_state ON parties(state)`);

        // Items Indexes
        await queryRunner.query(`CREATE INDEX idx_items_code ON items(code)`);
        await queryRunner.query(`CREATE INDEX idx_items_name ON items(name)`);
        await queryRunner.query(`CREATE INDEX idx_items_state ON items(state)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX idx_transactions_date ON transactions`);
        await queryRunner.query(`DROP INDEX idx_transactions_type ON transactions`);
        await queryRunner.query(`DROP INDEX idx_transactions_status ON transactions`);
        await queryRunner.query(`DROP INDEX idx_transactions_reference ON transactions`);

        await queryRunner.query(`DROP INDEX idx_parties_name ON parties`);
        await queryRunner.query(`DROP INDEX idx_parties_type ON parties`);
        await queryRunner.query(`DROP INDEX idx_parties_state ON parties`);

        await queryRunner.query(`DROP INDEX idx_items_code ON items`);
        await queryRunner.query(`DROP INDEX idx_items_name ON items`);
        await queryRunner.query(`DROP INDEX idx_items_state ON items`);
    }

}
