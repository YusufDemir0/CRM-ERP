-- ============================================================
--  ERP / CRM  —  Schema Update Script (V2)
--  Veritabanı: MySQL 8.0+
-- ============================================================

USE benyaptim;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Departman Tipleri
CREATE TABLE IF NOT EXISTS department_types (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    name             VARCHAR(100)   NOT NULL,
    abbreviation     VARCHAR(20)    NOT NULL,
    created_by       BIGINT             NULL,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by       BIGINT             NULL,
    updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP          NULL,
    state            BOOLEAN        NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Personel (Staff) Tablosu
CREATE TABLE IF NOT EXISTS staff (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    state            TINYINT        NOT NULL DEFAULT 1,
    created_by       BIGINT             NULL,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by       BIGINT             NULL,
    updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP          NULL,
    first_name       VARCHAR(100)   NOT NULL,
    last_name        VARCHAR(100)   NOT NULL,
    phone            VARCHAR(20)        NULL,
    entry_date       DATE               NULL,
    department_id    BIGINT         NOT NULL,
    is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT fk_staff_dept FOREIGN KEY (department_id) REFERENCES departments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Departmanlar Tablosuna Tip Bilgisi Ekleme
-- (Sütun kontrolü yaparak ekleme)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'benyaptim' AND TABLE_NAME = 'departments' AND COLUMN_NAME = 'department_type_id');
SET @sql_stmt = IF(@column_exists = 0, 'ALTER TABLE departments ADD COLUMN department_type_id BIGINT NULL AFTER abbreviation, ADD CONSTRAINT fk_dept_type FOREIGN KEY (department_type_id) REFERENCES department_types (id)', 'SELECT "Column department_type_id already exists"');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Satış Tablosuna Wizard Alanları Ekleme
-- phone
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'benyaptim' AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'phone');
SET @sql_stmt = IF(@column_exists = 0, 'ALTER TABLE sales ADD COLUMN phone VARCHAR(20) NULL', 'SELECT "Column phone already exists"');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- address
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'benyaptim' AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'address');
SET @sql_stmt = IF(@column_exists = 0, 'ALTER TABLE sales ADD COLUMN address TEXT NULL', 'SELECT "Column address already exists"');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- tax_number
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'benyaptim' AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'tax_number');
SET @sql_stmt = IF(@column_exists = 0, 'ALTER TABLE sales ADD COLUMN tax_number VARCHAR(20) NULL', 'SELECT "Column tax_number already exists"');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- email
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'benyaptim' AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'email');
SET @sql_stmt = IF(@column_exists = 0, 'ALTER TABLE sales ADD COLUMN email VARCHAR(100) NULL', 'SELECT "Column email already exists"');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- source
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'benyaptim' AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'source');
SET @sql_stmt = IF(@column_exists = 0, 'ALTER TABLE sales ADD COLUMN source VARCHAR(50) NULL', 'SELECT "Column source already exists"');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- staff_id
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'benyaptim' AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'staff_id');
SET @sql_stmt = IF(@column_exists = 0, 'ALTER TABLE sales ADD COLUMN staff_id BIGINT NULL AFTER department_id, ADD CONSTRAINT fk_sale_staff FOREIGN KEY (staff_id) REFERENCES staff (id)', 'SELECT "Column staff_id already exists"');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Cari Hesaplar (Parties) Tablosu Kredi Limiti Bölme
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'benyaptim' AND TABLE_NAME = 'parties' AND COLUMN_NAME = 'credit_limit_plus');
IF @column_exists = 0 THEN
    ALTER TABLE parties ADD COLUMN credit_limit_plus  DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER balance;
    ALTER TABLE parties ADD COLUMN credit_limit_minus DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER credit_limit_plus;
    UPDATE parties SET credit_limit_plus = credit_limit;
    -- ALTER TABLE parties DROP COLUMN credit_limit; -- Güvenlik için şimdilik kalsın veya silinebilir
END IF;

-- 6. Seed Data
INSERT IGNORE INTO department_types (name, abbreviation) VALUES
    ('Üretim', 'URT'),
    ('Satış', 'STS'),
    ('Depo', 'DEP'),
    ('İdari', 'IDR');

SET FOREIGN_KEY_CHECKS = 1;
