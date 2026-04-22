"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddItemTypeBomExclusion1776163392176 = void 0;
class AddItemTypeBomExclusion1776163392176 {
    constructor() {
        this.name = 'AddItemTypeBomExclusion1776163392176';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`item_types\` ADD \`is_excluded_from_bom\` tinyint NOT NULL DEFAULT 0`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`item_types\` DROP COLUMN \`is_excluded_from_bom\``);
    }
}
exports.AddItemTypeBomExclusion1776163392176 = AddItemTypeBomExclusion1776163392176;
//# sourceMappingURL=1776163392176-AddItemTypeBomExclusion.js.map