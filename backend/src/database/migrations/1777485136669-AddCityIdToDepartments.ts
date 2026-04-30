import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCityIdToDepartments1777485136669 implements MigrationInterface {
  name = 'AddCityIdToDepartments1777485136669';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`departments\` ADD \`city_id\` int NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`departments\` DROP COLUMN \`city_id\``
    );
  }
}
