"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTokenVersionToUsers1776163392165 = void 0;
class AddTokenVersionToUsers1776163392165 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 1 AFTER failed_login_attempts`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE users DROP COLUMN token_version`);
    }
}
exports.AddTokenVersionToUsers1776163392165 = AddTokenVersionToUsers1776163392165;
//# sourceMappingURL=1776163392165-AddTokenVersionToUsers.js.map