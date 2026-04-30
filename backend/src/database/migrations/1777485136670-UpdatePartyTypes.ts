import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePartyTypes1777485136670 implements MigrationInterface {
  name = 'UpdatePartyTypes1777485136670';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`parties\` SET \`type\` = 'customer' WHERE \`type\` IN ('both', 'provider')`
    );
    await queryRunner.query(
      `ALTER TABLE \`parties\` MODIFY COLUMN \`type\` ENUM('customer', 'supplier') NOT NULL DEFAULT 'customer'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`parties\` MODIFY COLUMN \`type\` ENUM('customer', 'provider', 'both') NOT NULL DEFAULT 'customer'`
    );
  }
}
