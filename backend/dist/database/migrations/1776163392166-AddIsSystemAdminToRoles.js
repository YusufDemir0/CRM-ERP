"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddIsSystemAdminToRoles1776163392166 = void 0;
class AddIsSystemAdminToRoles1776163392166 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE roles ADD COLUMN isSystemAdmin BOOLEAN NOT NULL DEFAULT FALSE AFTER name`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE roles DROP COLUMN isSystemAdmin`);
    }
}
exports.AddIsSystemAdminToRoles1776163392166 = AddIsSystemAdminToRoles1776163392166;
//# sourceMappingURL=1776163392166-AddIsSystemAdminToRoles.js.map