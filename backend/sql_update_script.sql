-- ============================================================
--  ERP / CRM  —  Schema Update Script
--  Veritabanı: MySQL 8.0+
-- ============================================================

USE benyaptim;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Departman Tipleri (Department Types) Tablosu
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

-- 2. Departmanlar Tablosuna Tip Bilgisi Ekleme
ALTER TABLE departments 
ADD COLUMN department_type_id BIGINT NULL AFTER abbreviation,
ADD CONSTRAINT fk_dept_type FOREIGN KEY (department_type_id) REFERENCES department_types (id);

-- 3. Cari Hesaplar (Parties) Tablosu Kredi Limiti Bölme
-- Mevcut verileri korumak için önce kolonları ekliyoruz, sonra eski kolonu siliyoruz.
ALTER TABLE parties 
ADD COLUMN credit_limit_plus  DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER balance,
ADD COLUMN credit_limit_minus DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER credit_limit_plus;

-- Mevcut credit_limit verisini geçici olarak plus tarafına alabiliriz (veya olduğu gibi bırakabiliriz)
UPDATE parties SET credit_limit_plus = credit_limit;

-- Eski kolonu silelim (Opsiyonel: Eğer veriler taşındıysa)
ALTER TABLE parties DROP COLUMN credit_limit;

-- 4. Temel Departman Tipleri (Seed Data)
INSERT INTO department_types (name, abbreviation) VALUES
    ('Üretim', 'URT'),
    ('Satış', 'STS'),
    ('Depo', 'DEP'),
    ('İdari', 'IDR');

SET FOREIGN_KEY_CHECKS = 1;
