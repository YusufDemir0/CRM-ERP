import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehiclesAndShipmentRelations1780450000000 implements MigrationInterface {
    name = 'CreateVehiclesAndShipmentRelations1780450000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create vehicles table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`vehicles\` (
                \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
                \`state\` int(11) NOT NULL DEFAULT '1',
                \`name\` varchar(255) NOT NULL,
                \`plate\` varchar(255) NOT NULL,
                \`description\` text NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` timestamp(6) NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Create shipment_vehicles relation table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`shipment_vehicles\` (
                \`shipment_id\` bigint(20) NOT NULL,
                \`vehicle_id\` bigint(20) NOT NULL,
                PRIMARY KEY (\`shipment_id\`, \`vehicle_id\`),
                INDEX \`IDX_shipment_vehicles_shipment_id\` (\`shipment_id\`),
                INDEX \`IDX_shipment_vehicles_vehicle_id\` (\`vehicle_id\`),
                CONSTRAINT \`FK_shipment_vehicles_shipment\` FOREIGN KEY (\`shipment_id\`) REFERENCES \`shipments\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT \`FK_shipment_vehicles_vehicle\` FOREIGN KEY (\`vehicle_id\`) REFERENCES \`vehicles\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Create shipment_staff relation table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`shipment_staff\` (
                \`shipment_id\` bigint(20) NOT NULL,
                \`staff_id\` bigint(20) NOT NULL,
                PRIMARY KEY (\`shipment_id\`, \`staff_id\`),
                INDEX \`IDX_shipment_staff_shipment_id\` (\`shipment_id\`),
                INDEX \`IDX_shipment_staff_staff_id\` (\`staff_id\`),
                CONSTRAINT \`FK_shipment_staff_shipment\` FOREIGN KEY (\`shipment_id\`) REFERENCES \`shipments\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT \`FK_shipment_staff_staff\` FOREIGN KEY (\`staff_id\`) REFERENCES \`staff\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`shipment_vehicles\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`shipment_staff\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`vehicles\``);
    }
}
