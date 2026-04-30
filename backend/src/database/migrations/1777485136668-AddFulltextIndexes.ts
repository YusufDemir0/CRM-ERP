import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFulltextIndexes1777485136668 implements MigrationInterface {
    name = 'AddFulltextIndexes1777485136668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD FULLTEXT INDEX \`IDX_USER_FULLTEXT\` (\`username\`, \`full_name\`, \`email\`, \`phone\`)`);
        await queryRunner.query(`ALTER TABLE \`parties\` ADD FULLTEXT INDEX \`IDX_PARTY_FULLTEXT\` (\`name\`, \`phone1\`, \`phone2\`, \`tax_office\`, \`tax_number\`, \`email\`, \`address\`, \`district_name\`, \`notes\`)`);
        await queryRunner.query(`ALTER TABLE \`items\` ADD FULLTEXT INDEX \`IDX_ITEM_FULLTEXT\` (\`name\`, \`code\`, \`code1\`, \`code2\`, \`description\`, \`notes\`)`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD FULLTEXT INDEX \`IDX_SALE_FULLTEXT\` (\`code\`, \`notes\`, \`contact_phone\`, \`address_detail\`, \`address_city\`, \`address_district\`, \`contact_tax_id\`, \`contact_email\`, \`lead_source\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`sales\` DROP INDEX \`IDX_SALE_FULLTEXT\``);
        await queryRunner.query(`ALTER TABLE \`items\` DROP INDEX \`IDX_ITEM_FULLTEXT\``);
        await queryRunner.query(`ALTER TABLE \`parties\` DROP INDEX \`IDX_PARTY_FULLTEXT\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_USER_FULLTEXT\``);
    }
}
