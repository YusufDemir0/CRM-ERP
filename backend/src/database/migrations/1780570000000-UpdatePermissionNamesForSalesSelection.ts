import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePermissionNamesForSalesSelection1780570000000 implements MigrationInterface {
    name = 'UpdatePermissionNamesForSalesSelection1780570000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const renames = [
            { key: 'PARTIES_USE_SELECTION', name: 'Satışta Tüm Carileri Gör' },
            { key: 'FINANCE_SELECT_ALL_CASH', name: 'Satışta Tüm Hesapları Gör' },
            { key: 'FINANCE_SELECT_DEPT_CASH', name: 'Satışta Departman Hesaplarını Gör' },
            { key: 'FINANCE_USE_SELECTION', name: 'Satışta Hesap Seçebilme' }
        ];

        for (const r of renames) {
            await queryRunner.query(
                `UPDATE \`permissions\` SET \`name\` = ? WHERE \`key\` = ?`,
                [r.name, r.key]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const rollbacks = [
            { key: 'PARTIES_USE_SELECTION', name: 'Satışta Cari Seçebilme' },
            { key: 'FINANCE_SELECT_ALL_CASH', name: 'Satışta Tüm Kasaları Seçebilme' },
            { key: 'FINANCE_SELECT_DEPT_CASH', name: 'Satışta Departman Kasalarını Seçebilme' },
            { key: 'FINANCE_USE_SELECTION', name: 'Satışta Kasa Seçebilme' }
        ];

        for (const r of rollbacks) {
            await queryRunner.query(
                `UPDATE \`permissions\` SET \`name\` = ? WHERE \`key\` = ?`,
                [r.name, r.key]
            );
        }
    }
}
