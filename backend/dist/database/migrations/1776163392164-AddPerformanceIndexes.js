"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPerformanceIndexes1776163392164 = void 0;
class AddPerformanceIndexes1776163392164 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX idx_transactions_date ON transactions(date)`);
        await queryRunner.query(`CREATE INDEX idx_transactions_type ON transactions(type)`);
        await queryRunner.query(`CREATE INDEX idx_transactions_status ON transactions(status)`);
        await queryRunner.query(`CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id)`);
        await queryRunner.query(`CREATE INDEX idx_parties_name ON parties(name)`);
        await queryRunner.query(`CREATE INDEX idx_parties_type ON parties(type)`);
        await queryRunner.query(`CREATE INDEX idx_parties_state ON parties(state)`);
        await queryRunner.query(`CREATE INDEX idx_items_code ON items(code)`);
        await queryRunner.query(`CREATE INDEX idx_items_name ON items(name)`);
        await queryRunner.query(`CREATE INDEX idx_items_state ON items(state)`);
    }
    async down(queryRunner) {
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
exports.AddPerformanceIndexes1776163392164 = AddPerformanceIndexes1776163392164;
//# sourceMappingURL=1776163392164-AddPerformanceIndexes.js.map