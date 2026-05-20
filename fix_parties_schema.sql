-- ERMAY ERP: Cari ve Muhasebe Tablosu Eksik Sütun Tamamlama
-- Amacı: 'ER_BAD_FIELD_ERROR' hatasını çözmek için eksik sütunları eklemek.

-- 1. Parties tablosuna eksik olan department_id sütununu ekle
ALTER TABLE parties ADD COLUMN IF NOT EXISTS department_id bigint(20) DEFAULT NULL;

-- 2. Accounting Ledger tablosuna eksik olan transaction_id ve source sütunlarını ekle
ALTER TABLE accounting_ledger ADD COLUMN IF NOT EXISTS transaction_id varchar(255) DEFAULT NULL;
ALTER TABLE accounting_ledger ADD COLUMN IF NOT EXISTS source varchar(50) DEFAULT NULL;

-- 3. Enum tipini tekrar kontrol et ve garantiye al
ALTER TABLE parties MODIFY COLUMN type ENUM('customer', 'provider') NOT NULL DEFAULT 'customer';
