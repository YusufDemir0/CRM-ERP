"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixMissingTablesV61715760000006 = void 0;
class FixMissingTablesV61715760000006 {
    constructor() {
        this.name = 'FixMissingTablesV61715760000006';
    }
    async up(queryRunner) {
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0;`);
        const tablesToCreate = [
            `CREATE TABLE IF NOT EXISTS \`currencies\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`code\` char(3) NOT NULL,
              \`name\` varchar(50) NOT NULL,
              \`symbol\` varchar(10) NOT NULL,
              \`exchange_rate\` decimal(15,6) NOT NULL DEFAULT 1.000000,
              \`is_default\` tinyint(1) NOT NULL DEFAULT 0,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`IDX_currencies_code\` (\`code\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`quantity_types\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(50) NOT NULL,
              \`abbreviation\` varchar(10) NOT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`item_types\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(100) NOT NULL,
              \`abbreviation\` varchar(20) NOT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              \`is_excluded_from_bom\` tinyint(4) NOT NULL DEFAULT 0,
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`item_code_groups\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(150) NOT NULL,
              \`prefix\` varchar(10) NOT NULL,
              \`state\` tinyint(4) NOT NULL DEFAULT 1,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`IDX_item_code_groups_prefix\` (\`prefix\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`parties\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`type\` enum('customer','provider') NOT NULL DEFAULT 'customer',
              \`name\` varchar(150) NOT NULL,
              \`phone1\` varchar(20) DEFAULT NULL,
              \`phone2\` varchar(20) DEFAULT NULL,
              \`tax_office\` varchar(100) DEFAULT NULL,
              \`tax_number\` varchar(20) DEFAULT NULL,
              \`email\` varchar(100) DEFAULT NULL,
              \`address\` text DEFAULT NULL,
              \`city_id\` int(11) DEFAULT NULL,
              \`district_name\` varchar(100) DEFAULT NULL,
              \`balance\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`credit_limit\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`payment_terms\` varchar(50) DEFAULT NULL,
              \`currency_id\` bigint(20) DEFAULT NULL,
              \`department_id\` bigint(20) DEFAULT NULL,
              \`notes\` text DEFAULT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              KEY \`FK_parties_currency\` (\`currency_id\`),
              CONSTRAINT \`FK_parties_currency\` FOREIGN KEY (\`currency_id\`) REFERENCES \`currencies\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`commercial_accounts\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(100) NOT NULL,
              \`bank_name\` varchar(100) DEFAULT NULL,
              \`iban\` varchar(34) DEFAULT NULL,
              \`iban_name\` varchar(100) DEFAULT NULL,
              \`currency_id\` bigint(20) NOT NULL,
              \`critical_limit\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`description\` text DEFAULT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              KEY \`FK_commercial_accounts_currency\` (\`currency_id\`),
              CONSTRAINT \`FK_commercial_accounts_currency\` FOREIGN KEY (\`currency_id\`) REFERENCES \`currencies\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`department_types\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(100) NOT NULL,
              \`abbreviation\` varchar(20) NOT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`departments\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(100) NOT NULL,
              \`description\` text DEFAULT NULL,
              \`abbreviation\` varchar(20) DEFAULT NULL,
              \`department_type_id\` bigint(20) DEFAULT NULL,
              \`commercial_account_id\` bigint(20) DEFAULT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              KEY \`FK_departments_type\` (\`department_type_id\`),
              KEY \`FK_departments_account\` (\`commercial_account_id\`),
              CONSTRAINT \`FK_departments_type\` FOREIGN KEY (\`department_type_id\`) REFERENCES \`department_types\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
              CONSTRAINT \`FK_departments_account\` FOREIGN KEY (\`commercial_account_id\`) REFERENCES \`commercial_accounts\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`staff\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`state\` tinyint(4) NOT NULL DEFAULT 1,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`first_name\` varchar(100) NOT NULL,
              \`last_name\` varchar(100) NOT NULL,
              \`phone\` varchar(20) DEFAULT NULL,
              \`entry_date\` date DEFAULT NULL,
              \`department_id\` bigint(20) NOT NULL,
              \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
              \`tckn\` varchar(11) DEFAULT NULL,
              \`last_deactivation_date\` date DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`FK_staff_department\` (\`department_id\`),
              CONSTRAINT \`FK_staff_department\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`users\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`username\` varchar(50) NOT NULL,
              \`password_hash\` varchar(255) NOT NULL,
              \`full_name\` varchar(100) NOT NULL,
              \`email\` varchar(100) NOT NULL,
              \`phone\` varchar(20) DEFAULT NULL,
              \`department_id\` bigint(20) DEFAULT NULL,
              \`failed_login_attempts\` int(11) NOT NULL DEFAULT 0,
              \`token_version\` int(11) NOT NULL DEFAULT 1,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              \`locked_until\` timestamp NULL DEFAULT NULL,
              \`entry_date\` date DEFAULT NULL,
              \`last_deactivation_date\` date DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`UQ_users_email\` (\`email\`),
              UNIQUE KEY \`UQ_users_username\` (\`username\`),
              KEY \`FK_users_department\` (\`department_id\`),
              CONSTRAINT \`FK_users_department\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`roles\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(50) NOT NULL,
              \`isSystemAdmin\` tinyint(1) NOT NULL DEFAULT 0,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`IDX_roles_name\` (\`name\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`permissions\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`key\` varchar(100) NOT NULL,
              \`name\` varchar(100) NOT NULL,
              \`module\` varchar(50) NOT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              \`action\` varchar(20) DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`IDX_permissions_key\` (\`key\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`user_roles\` (
              \`user_id\` bigint(20) NOT NULL,
              \`role_id\` bigint(20) NOT NULL,
              PRIMARY KEY (\`user_id\`,\`role_id\`),
              KEY \`FK_user_roles_user\` (\`user_id\`),
              KEY \`FK_user_roles_role\` (\`role_id\`),
              CONSTRAINT \`FK_user_roles_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
              CONSTRAINT \`FK_user_roles_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`role_permissions\` (
              \`role_id\` bigint(20) NOT NULL,
              \`permission_id\` bigint(20) NOT NULL,
              PRIMARY KEY (\`role_id\`,\`permission_id\`),
              KEY \`FK_role_perms_role\` (\`role_id\`),
              KEY \`FK_role_perms_perm\` (\`permission_id\`),
              CONSTRAINT \`FK_role_perms_perm\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
              CONSTRAINT \`FK_role_perms_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`items\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(150) NOT NULL,
              \`item_type_id\` bigint(20) NOT NULL,
              \`item_code_group_id\` bigint(20) DEFAULT NULL,
              \`code\` varchar(50) NOT NULL,
              \`code1\` varchar(50) DEFAULT NULL,
              \`code2\` varchar(50) DEFAULT NULL,
              \`provider_id\` bigint(20) DEFAULT NULL,
              \`critical_limit\` decimal(15,4) NOT NULL DEFAULT 0.0000,
              \`image\` varchar(255) DEFAULT NULL,
              \`purchase_price\` decimal(15,2) DEFAULT NULL,
              \`moving_average_cost\` decimal(15,4) NOT NULL DEFAULT 0.0000,
              \`sale_price\` decimal(15,2) DEFAULT NULL,
              \`net_price\` decimal(15,2) DEFAULT NULL,
              \`currency_id\` bigint(20) DEFAULT NULL,
              \`quantity_type_id\` bigint(20) NOT NULL,
              \`kdv\` decimal(5,2) NOT NULL DEFAULT 20.00,
              \`total_stock\` decimal(15,4) NOT NULL DEFAULT 0.0000,
              \`description\` text DEFAULT NULL,
              \`notes\` text DEFAULT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`UQ_items_code\` (\`code\`),
              KEY \`FK_items_type\` (\`item_type_id\`),
              KEY \`FK_items_qty_type\` (\`quantity_type_id\`),
              CONSTRAINT \`FK_items_qty_type\` FOREIGN KEY (\`quantity_type_id\`) REFERENCES \`quantity_types\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
              CONSTRAINT \`FK_items_type\` FOREIGN KEY (\`item_type_id\`) REFERENCES \`item_types\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`boms\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(100) NOT NULL,
              \`target_item_id\` bigint(20) DEFAULT NULL,
              \`version\` int(11) NOT NULL DEFAULT 1,
              \`is_active\` tinyint(4) NOT NULL DEFAULT 1,
              \`description\` text DEFAULT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              KEY \`FK_boms_target\` (\`target_item_id\`),
              CONSTRAINT \`FK_boms_target\` FOREIGN KEY (\`target_item_id\`) REFERENCES \`items\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`bom_items\` (
              \`bom_id\` bigint(20) NOT NULL,
              \`item_id\` bigint(20) NOT NULL,
              \`quantity\` decimal(15,4) NOT NULL,
              \`description\` text DEFAULT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              PRIMARY KEY (\`bom_id\`,\`item_id\`),
              KEY \`FK_bom_items_item\` (\`item_id\`),
              CONSTRAINT \`FK_bom_items_bom\` FOREIGN KEY (\`bom_id\`) REFERENCES \`boms\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
              CONSTRAINT \`FK_bom_items_item\` FOREIGN KEY (\`item_id\`) REFERENCES \`items\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`stocks\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`item_id\` bigint(20) NOT NULL,
              \`department_id\` bigint(20) NOT NULL,
              \`quantity\` decimal(15,4) NOT NULL DEFAULT 0.0000,
              \`reserved_quantity\` decimal(15,4) NOT NULL DEFAULT 0.0000,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`IDX_stocks_item_dept\` (\`item_id\`,\`department_id\`),
              KEY \`FK_stocks_dept\` (\`department_id\`),
              CONSTRAINT \`FK_stocks_dept\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
              CONSTRAINT \`FK_stocks_item\` FOREIGN KEY (\`item_id\`) REFERENCES \`items\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`sale_types\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`name\` varchar(50) NOT NULL,
              \`abbreviation\` varchar(20) NOT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`sales\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`code\` varchar(50) NOT NULL,
              \`party_id\` bigint(20) NOT NULL,
              \`sale_type_id\` bigint(20) NOT NULL,
              \`department_id\` bigint(20) DEFAULT NULL,
              \`staff_id\` bigint(20) DEFAULT NULL,
              \`currency_id\` bigint(20) DEFAULT NULL,
              \`exchange_rate\` decimal(15,6) NOT NULL DEFAULT 1.000000,
              \`delivery_date\` date DEFAULT NULL,
              \`status\` enum('draft','approved','shipped','invoiced','cancelled') NOT NULL DEFAULT 'draft',
              \`deposit\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`total_amount\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`discount_amount\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`discount_percent\` decimal(5,2) NOT NULL DEFAULT 0.00,
              \`kdv\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`grand_total\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`total_cost\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`profit\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`notes\` text DEFAULT NULL,
              \`contact_phone\` varchar(20) DEFAULT NULL,
              \`address_detail\` text DEFAULT NULL,
              \`address_city\` varchar(50) DEFAULT NULL,
              \`address_district\` varchar(50) DEFAULT NULL,
              \`contact_tax_id\` varchar(20) DEFAULT NULL,
              \`contact_email\` varchar(100) DEFAULT NULL,
              \`lead_source\` varchar(50) DEFAULT NULL,
              \`commercial_account_id\` bigint(20) DEFAULT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`IDX_sales_code\` (\`code\`),
              KEY \`FK_sales_party\` (\`party_id\`),
              KEY \`FK_sales_type\` (\`sale_type_id\`),
              CONSTRAINT \`FK_sales_party\` FOREIGN KEY (\`party_id\`) REFERENCES \`parties\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
              CONSTRAINT \`FK_sales_type\` FOREIGN KEY (\`sale_type_id\`) REFERENCES \`sale_types\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`sale_items\` (
              \`sale_id\` bigint(20) NOT NULL,
              \`item_id\` bigint(20) NOT NULL,
              \`quantity\` decimal(15,4) NOT NULL,
              \`shipped_quantity\` decimal(15,4) NOT NULL DEFAULT 0.0000,
              \`price\` decimal(15,2) NOT NULL,
              \`cost_price\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`discount_amount\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`discount_percent\` decimal(5,2) NOT NULL DEFAULT 0.00,
              \`net_price\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`kdv_rate\` decimal(5,2) NOT NULL DEFAULT 20.00,
              \`kdv_amount\` decimal(15,2) NOT NULL DEFAULT 0.00,
              \`line_total\` decimal(15,2) NOT NULL,
              \`description\` text DEFAULT NULL,
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              PRIMARY KEY (\`sale_id\`,\`item_id\`),
              KEY \`FK_sale_items_item\` (\`item_id\`),
              CONSTRAINT \`FK_sale_items_item\` FOREIGN KEY (\`item_id\`) REFERENCES \`items\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
              CONSTRAINT \`FK_sale_items_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`accounting_ledger\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`date\` date NOT NULL,
              \`party_id\` bigint(20) NOT NULL,
              \`account_id\` bigint(20) DEFAULT NULL,
              \`debit\` decimal(18,2) NOT NULL DEFAULT 0.00,
              \`credit\` decimal(18,2) NOT NULL DEFAULT 0.00,
              \`description\` text DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`FK_ledger_party\` (\`party_id\`),
              KEY \`FK_ledger_account\` (\`account_id\`),
              CONSTRAINT \`FK_ledger_account\` FOREIGN KEY (\`account_id\`) REFERENCES \`commercial_accounts\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
              CONSTRAINT \`FK_ledger_party\` FOREIGN KEY (\`party_id\`) REFERENCES \`parties\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`settings\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`setting_key\` varchar(100) NOT NULL,
              \`setting_value\` text DEFAULT NULL,
              \`description\` varchar(255) DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`IDX_settings_key\` (\`setting_key\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`audit_logs\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`entity_name\` varchar(100) NOT NULL,
              \`entity_id\` bigint(20) DEFAULT NULL,
              \`action\` varchar(50) NOT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`item_sequences\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`item_type_id\` bigint(20) NOT NULL,
              \`current_number\` int(11) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`IDX_item_sequences_type\` (\`item_type_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`item_code_sequences\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`item_code_group_id\` bigint(20) NOT NULL,
              \`current_number\` int(11) NOT NULL DEFAULT 0,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`UQ_item_code_group_seq\` (\`item_code_group_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`sale_sequences\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`department_id\` bigint(20) NOT NULL,
              \`current_number\` int(11) NOT NULL DEFAULT 0,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`UQ_sale_dept_seq\` (\`department_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`production_sequences\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`prefix\` varchar(20) NOT NULL,
              \`current_number\` int(11) NOT NULL DEFAULT 0,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`UQ_prod_prefix_seq\` (\`prefix\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`transaction_sequences\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`prefix\` varchar(20) NOT NULL,
              \`current_number\` int(11) NOT NULL DEFAULT 0,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`UQ_trans_prefix_seq\` (\`prefix\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            `CREATE TABLE IF NOT EXISTS \`transactions\` (
              \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
              \`code\` varchar(50) NOT NULL,
              \`party_id\` bigint(20) DEFAULT NULL,
              \`commercial_account_id\` bigint(20) DEFAULT NULL,
              \`amount\` decimal(15,2) NOT NULL,
              \`currency_id\` bigint(20) DEFAULT NULL,
              \`exchange_rate\` decimal(15,6) NOT NULL DEFAULT 1.000000,
              \`type\` enum('in','out') NOT NULL,
              \`reference_type\` enum('sale','purchase','manual_adjustment','manual','sale_deposit') DEFAULT NULL,
              \`reference_id\` bigint(20) DEFAULT NULL,
              \`date\` date NOT NULL,
              \`description\` text DEFAULT NULL,
              \`status\` enum('pending','completed','bounced_check','cancelled') NOT NULL DEFAULT 'pending',
              \`created_by\` bigint(20) DEFAULT NULL,
              \`created_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
              \`updated_by\` bigint(20) DEFAULT NULL,
              \`updated_at\` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
              \`deleted_at\` timestamp(6) NULL DEFAULT NULL,
              \`state\` tinyint(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`IDX_transactions_code\` (\`code\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        ];
        for (const query of tablesToCreate) {
            await queryRunner.query(query);
        }
        const patches = [
            { table: 'items', columns: [
                    { name: 'code1', type: 'varchar(50) DEFAULT NULL' },
                    { name: 'code2', type: 'varchar(50) DEFAULT NULL' },
                    { name: 'image', type: 'varchar(255) DEFAULT NULL' },
                    { name: 'moving_average_cost', type: 'decimal(15,4) NOT NULL DEFAULT 0.0000' },
                    { name: 'net_price', type: 'decimal(15,2) DEFAULT NULL' },
                    { name: 'total_stock', type: 'decimal(15,4) NOT NULL DEFAULT 0.0000' },
                    { name: 'description', type: 'text DEFAULT NULL' },
                    { name: 'notes', type: 'text DEFAULT NULL' },
                    { name: 'created_by', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'updated_by', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'deleted_at', type: 'timestamp(6) NULL DEFAULT NULL' }
                ] },
            { table: 'sales', columns: [
                    { name: 'department_id', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'staff_id', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'currency_id', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'exchange_rate', type: 'decimal(15,6) NOT NULL DEFAULT 1.000000' },
                    { name: 'delivery_date', type: 'date DEFAULT NULL' },
                    { name: 'deposit', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'total_amount', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'discount_amount', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'discount_percent', type: 'decimal(5,2) NOT NULL DEFAULT 0.00' },
                    { name: 'kdv', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'grand_total', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'total_cost', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'profit', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'notes', type: 'text DEFAULT NULL' },
                    { name: 'contact_phone', type: 'varchar(20) DEFAULT NULL' },
                    { name: 'address_detail', type: 'text DEFAULT NULL' },
                    { name: 'address_city', type: 'varchar(50) DEFAULT NULL' },
                    { name: 'address_district', type: 'varchar(50) DEFAULT NULL' },
                    { name: 'contact_tax_id', type: 'varchar(20) DEFAULT NULL' },
                    { name: 'contact_email', type: 'varchar(100) DEFAULT NULL' },
                    { name: 'lead_source', type: 'varchar(50) DEFAULT NULL' },
                    { name: 'commercial_account_id', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'created_by', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'updated_by', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'deleted_at', type: 'timestamp(6) NULL DEFAULT NULL' }
                ] },
            { table: 'sale_items', columns: [
                    { name: 'quantity', type: 'decimal(15,4) NOT NULL' },
                    { name: 'price', type: 'decimal(15,2) NOT NULL' },
                    { name: 'line_total', type: 'decimal(15,2) NOT NULL' },
                    { name: 'shipped_quantity', type: 'decimal(15,4) NOT NULL DEFAULT 0.0000' },
                    { name: 'cost_price', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'discount_amount', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'discount_percent', type: 'decimal(5,2) NOT NULL DEFAULT 0.00' },
                    { name: 'net_price', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'kdv_rate', type: 'decimal(5,2) NOT NULL DEFAULT 20.00' },
                    { name: 'kdv_amount', type: 'decimal(15,2) NOT NULL DEFAULT 0.00' },
                    { name: 'description', type: 'text DEFAULT NULL' },
                    { name: 'created_by', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'updated_by', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'deleted_at', type: 'timestamp(6) NULL DEFAULT NULL' }
                ] },
            { table: 'parties', columns: [
                    { name: 'department_id', type: 'bigint(20) DEFAULT NULL' }
                ] },
            { table: 'transactions', columns: [
                    { name: 'created_by', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'updated_by', type: 'bigint(20) DEFAULT NULL' },
                    { name: 'deleted_at', type: 'timestamp(6) NULL DEFAULT NULL' }
                ] }
        ];
        for (const patch of patches) {
            for (const col of patch.columns) {
                try {
                    const columnCheck = await queryRunner.query(`
                        SELECT COLUMN_NAME 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME = '${patch.table}' 
                        AND COLUMN_NAME = '${col.name}' 
                        AND TABLE_SCHEMA = DATABASE()
                    `);
                    if (columnCheck.length === 0) {
                        await queryRunner.query(`ALTER TABLE \`${patch.table}\` ADD COLUMN \`${col.name}\` ${col.type}`);
                    }
                    else {
                        await queryRunner.query(`ALTER TABLE \`${patch.table}\` MODIFY COLUMN \`${col.name}\` ${col.type}`);
                    }
                }
                catch (e) {
                    console.error(`Failed to patch ${patch.table}.${col.name}:`, e);
                }
            }
        }
        try {
            await queryRunner.query(`ALTER TABLE \`parties\` MODIFY COLUMN \`type\` ENUM('customer', 'provider') NOT NULL DEFAULT 'customer'`);
            await queryRunner.query(`ALTER TABLE \`transactions\` MODIFY COLUMN \`reference_type\` ENUM('sale', 'purchase', 'manual_adjustment', 'manual', 'sale_deposit') DEFAULT NULL`);
        }
        catch (e) { }
        const seeds = [
            `INSERT IGNORE INTO \`currencies\` (id, code, name, symbol, exchange_rate, is_default, state) VALUES (1,'TRY','Türk Lirası','₺',1.000000,1,1)`,
            `INSERT IGNORE INTO \`currencies\` (id, code, name, symbol, exchange_rate, is_default, state) VALUES (2,'USD','Amerikan Doları','$',32.500000,0,1)`,
            `INSERT IGNORE INTO \`currencies\` (id, code, name, symbol, exchange_rate, is_default, state) VALUES (3,'EUR','Euro','€',35.200000,0,1)`,
            `INSERT IGNORE INTO \`department_types\` (id, name, abbreviation, state) VALUES (1,'Üretim','URT',1)`,
            `INSERT IGNORE INTO \`department_types\` (id, name, abbreviation, state) VALUES (2,'Satış','STS',1)`,
            `INSERT IGNORE INTO \`department_types\` (id, name, abbreviation, state) VALUES (3,'Depo','DEP',1)`,
            `INSERT IGNORE INTO \`roles\` (id, name, isSystemAdmin, state) VALUES (1,'Admin',1,1)`,
            `INSERT IGNORE INTO \`roles\` (id, name, isSystemAdmin, state) VALUES (2,'Kullanıcı',0,1)`,
            `INSERT IGNORE INTO \`users\` (id, username, password_hash, full_name, email, state) VALUES (1,'testadmin','$2b$12$.JTpsIEzqb182ZviAq2jQ.y/DaOP.iVHLMd.UqjpJg0X.ziBnRLfa','Test Admin','admin@test.com',1)`,
            `INSERT IGNORE INTO \`user_roles\` (user_id, role_id) VALUES (1, 1)`,
            `INSERT IGNORE INTO \`quantity_types\` (id, name, abbreviation, state) VALUES (1,'Adet','AD',1)`,
            `INSERT IGNORE INTO \`quantity_types\` (id, name, abbreviation, state) VALUES (2,'Kilogram','KG',1)`,
            `INSERT IGNORE INTO \`quantity_types\` (id, name, abbreviation, state) VALUES (3,'Gram','GR',1)`,
            `INSERT IGNORE INTO \`quantity_types\` (id, name, abbreviation, state) VALUES (4,'Litre','LT',1)`,
            `INSERT IGNORE INTO \`sale_types\` (id, name, abbreviation, state) VALUES (1,'Toptan Satış','TPT',1)`,
            `INSERT IGNORE INTO \`sale_types\` (id, name, abbreviation, state) VALUES (2,'Perakende Satış','PRK',1)`,
            `INSERT IGNORE INTO \`sale_types\` (id, name, abbreviation, state) VALUES (3,'İhracat','IHR',1)`,
            `INSERT IGNORE INTO \`settings\` (setting_key, setting_value, description) VALUES ('default_currency','TRY','Varsayılan sistem para birimi')`,
            `INSERT IGNORE INTO \`settings\` (setting_key, setting_value, description) VALUES ('company_name','ERMAY ERP','Şirket adı')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SALES_VIEW','Satışları Görüntüle','sales','read')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SALES_CREATE','Satış Oluştur','sales','create')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SALES_EDIT','Satış Düzenle','sales','update')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SALES_APPROVE','Satış Onayla','sales','manage')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SALES_CANCEL','Satış İptal Et','sales','manage')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SALES_DELETE','Satış Sil','sales','delete')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SALES_MASTER_APPROVE','Yetkili Satış Onaylama','sales','manage')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('CUSTOMER_VIEW','Carileri Görüntüle','parties','read')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('CUSTOMER_CREATE','Cari Ekle','parties','create')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('CUSTOMER_EDIT','Cari Düzenle','parties','update')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('CUSTOMER_DELETE','Cari Sil','parties','delete')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('INVENTORY_VIEW','Stok/Ürün Görüntüle','inventory','read')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('INVENTORY_CREATE','Ürün Ekle','inventory','create')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('INVENTORY_EDIT','Stok/Ürün Düzenle','inventory','update')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('INVENTORY_DELETE','Ürün Sil','inventory','delete')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('FINANCE_VIEW','Hesap Hareketlerini Gör','finance','read')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('FINANCE_MANAGE','Hesap İşlemi Yap','finance','manage')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('PRODUCTION_VIEW','Üretim Emirlerini Gör','production','read')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('PRODUCTION_CREATE','Üretim Emri Oluştur','production','create')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('PRODUCTION_EDIT','Üretim Emri Düzenle','production','update')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('PRODUCTION_DELETE','Üretim Emri Sil','production','delete')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('USER_VIEW','Kullanıcıları Gör','users','read')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('USER_CREATE','Kullanıcı Oluştur','users','create')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('USER_EDIT','Kullanıcı Düzenle','users','update')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('USER_DELETE','Kullanıcı Sil','users','delete')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('ROLE_VIEW','Rolleri Gör','roles','read')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('ROLE_CREATE','Rol Oluştur','roles','create')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('ROLE_EDIT','Rol Düzenle','roles','update')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('ROLE_DELETE','Rol Sil','roles','delete')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('ROLE_ASSIGN','Rol Ata','roles','manage')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('PERMISSION_VIEW','Yetkileri Gör','roles','read')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('PERMISSION_ASSIGN','Yetki Override','roles','manage')`,
            `INSERT IGNORE INTO \`permissions\` (\`key\`, name, module, action) VALUES ('SYSTEM_MANAGE','Sistem Yönetimi','system','manage')`
        ];
        for (const seed of seeds) {
            await queryRunner.query(seed);
        }
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0;`);
        const tables = [
            'accounting_ledger', 'audit_logs', 'bom_items', 'boms', 'commercial_accounts',
            'currencies', 'department_types', 'departments', 'items', 'item_types',
            'item_code_groups', 'parties', 'permissions', 'quantity_types', 'role_permissions',
            'roles', 'sale_items', 'sale_types', 'sales', 'settings', 'staff', 'stocks',
            'user_roles', 'users', 'item_sequences', 'item_code_sequences', 'sale_sequences',
            'production_sequences', 'transaction_sequences', 'transactions'
        ];
        for (const table of tables) {
            await queryRunner.query(`DROP TABLE IF EXISTS \`${table}\`;`);
        }
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    }
}
exports.FixMissingTablesV61715760000006 = FixMissingTablesV61715760000006;
//# sourceMappingURL=migration.js.map