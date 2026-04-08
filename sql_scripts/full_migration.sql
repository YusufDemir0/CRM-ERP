-- ============================================================
-- ERMAY ERP — FULL SCHEMA MIGRATION (Idempotent)
-- Tarih: 2026-04-09
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ──────────────────────────────────────────────
-- 1. CORE LOOKUP TABLES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS department_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(20) NOT NULL,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  abbreviation VARCHAR(20),
  department_type_id BIGINT,
  commercial_account_id BIGINT,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_dept_type (department_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  department_id BIGINT,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_user_dept (department_id),
  CONSTRAINT fk_user_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────
-- 2. PERMISSION SYSTEM
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_perm_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permission_groups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permission_group_items (
  group_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (group_id, permission_id),
  CONSTRAINT fk_pgi_group FOREIGN KEY (group_id) REFERENCES permission_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_pgi_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  scope_type ENUM('global', 'department', 'own') DEFAULT 'global',
  effect ENUM('allow', 'deny') NOT NULL,
  scope_id BIGINT,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (user_id, permission_id, scope_type),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_up_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────
-- 3. FINANCE TABLES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS currencies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(3) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  exchange_rate DECIMAL(15,6) DEFAULT 1.000000,
  is_default TINYINT DEFAULT 0,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS commercial_accounts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100),
  iban VARCHAR(34),
  iban_name VARCHAR(100),
  currency_id BIGINT NOT NULL,
  critical_limit DECIMAL(15,2) DEFAULT 0.00,
  description TEXT,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_acct_currency (currency_id),
  CONSTRAINT fk_acct_currency FOREIGN KEY (currency_id) REFERENCES currencies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS parties (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('customer', 'provider', 'both') DEFAULT 'customer',
  name VARCHAR(150) NOT NULL,
  phone1 VARCHAR(20),
  phone2 VARCHAR(20),
  tax_number VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  balance DECIMAL(15,2) DEFAULT 0.00,
  credit_limit_plus DECIMAL(15,2) DEFAULT 0.00,
  credit_limit_minus DECIMAL(15,2) DEFAULT 0.00,
  payment_terms VARCHAR(50),
  currency_id BIGINT,
  notes TEXT,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_party_type (type),
  INDEX idx_party_currency (currency_id),
  INDEX idx_party_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transaction_sequences (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  prefix VARCHAR(10) NOT NULL,
  current_number INT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  state TINYINT DEFAULT 1,
  UNIQUE KEY uk_txn_prefix (prefix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  party_id BIGINT NOT NULL,
  commercial_account_id BIGINT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency_id BIGINT,
  exchange_rate DECIMAL(15,6) DEFAULT 1.000000,
  type ENUM('in', 'out') NOT NULL,
  reference_type ENUM('sale', 'purchase', 'manual_adjustment'),
  reference_id BIGINT,
  date DATE NOT NULL,
  description TEXT,
  status ENUM('pending', 'completed', 'bounced_check', 'cancelled') DEFAULT 'pending',
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_txn_party (party_id),
  INDEX idx_txn_account (commercial_account_id),
  INDEX idx_txn_date (date),
  INDEX idx_txn_status (status),
  CONSTRAINT fk_txn_party FOREIGN KEY (party_id) REFERENCES parties(id),
  CONSTRAINT fk_txn_acct FOREIGN KEY (commercial_account_id) REFERENCES commercial_accounts(id),
  CONSTRAINT fk_txn_currency FOREIGN KEY (currency_id) REFERENCES currencies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────
-- 4. INVENTORY TABLES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS item_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(20) NOT NULL,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS item_code_groups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  prefix VARCHAR(10) NOT NULL UNIQUE,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS item_code_sequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_code_group_id BIGINT NOT NULL UNIQUE,
  current_number INT DEFAULT 1,
  CONSTRAINT fk_ics_group FOREIGN KEY (item_code_group_id) REFERENCES item_code_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS item_sequences (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_type_id BIGINT NOT NULL UNIQUE,
  current_number INT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  state TINYINT DEFAULT 1,
  CONSTRAINT fk_is_type FOREIGN KEY (item_type_id) REFERENCES item_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quantity_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  item_type_id BIGINT NOT NULL,
  item_code_group_id BIGINT,
  code VARCHAR(50) NOT NULL UNIQUE,
  code1 VARCHAR(50),
  code2 VARCHAR(50),
  critical_limit DECIMAL(15,4) DEFAULT 0.0000,
  image VARCHAR(255),
  purchase_price DECIMAL(15,2),
  sale_price DECIMAL(15,2),
  net_price DECIMAL(15,2),
  currency_id BIGINT,
  quantity_type_id BIGINT NOT NULL,
  kdv DECIMAL(5,2) DEFAULT 20.00,
  description TEXT,
  notes TEXT,
  provider_id BIGINT,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_item_type (item_type_id),
  INDEX idx_item_code_group (item_code_group_id),
  INDEX idx_item_currency (currency_id),
  INDEX idx_item_qty_type (quantity_type_id),
  INDEX idx_item_provider (provider_id),
  INDEX idx_item_name (name),
  CONSTRAINT fk_item_type FOREIGN KEY (item_type_id) REFERENCES item_types(id),
  CONSTRAINT fk_item_cg FOREIGN KEY (item_code_group_id) REFERENCES item_code_groups(id),
  CONSTRAINT fk_item_currency FOREIGN KEY (currency_id) REFERENCES currencies(id),
  CONSTRAINT fk_item_qty FOREIGN KEY (quantity_type_id) REFERENCES quantity_types(id),
  CONSTRAINT fk_item_provider FOREIGN KEY (provider_id) REFERENCES parties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stocks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_id BIGINT NOT NULL,
  department_id BIGINT NOT NULL,
  quantity DECIMAL(15,4) DEFAULT 0.0000,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uk_stock_item_dept (item_id, department_id),
  INDEX idx_stock_item (item_id),
  INDEX idx_stock_dept (department_id),
  CONSTRAINT fk_stock_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_stock_dept FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stock_id BIGINT NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  quantity_before DECIMAL(15,4) NOT NULL,
  quantity_after DECIMAL(15,4) NOT NULL,
  type ENUM('in', 'out') NOT NULL,
  reference_type ENUM('sale', 'purchase', 'production', 'adjustment', 'return', 'manual') NOT NULL,
  reference_id BIGINT,
  description TEXT,
  notes TEXT,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_sm_stock (stock_id),
  INDEX idx_sm_ref (reference_type, reference_id),
  CONSTRAINT fk_sm_stock FOREIGN KEY (stock_id) REFERENCES stocks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────
-- 5. SALES TABLES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sale_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  abbreviation VARCHAR(20) NOT NULL,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sale_sequences (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sale_type_id BIGINT NOT NULL UNIQUE,
  current_number INT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  state TINYINT DEFAULT 1,
  CONSTRAINT fk_ss_type FOREIGN KEY (sale_type_id) REFERENCES sale_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  party_id BIGINT NOT NULL,
  sale_type_id BIGINT NOT NULL,
  currency_id BIGINT,
  exchange_rate DECIMAL(15,6) DEFAULT 1.000000,
  delivery_date DATE,
  status ENUM('draft', 'approved', 'shipped', 'invoiced', 'cancelled') DEFAULT 'draft',
  deposit DECIMAL(15,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) DEFAULT 0.00,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  discount_percent DECIMAL(5,2) DEFAULT 0.00,
  kdv DECIMAL(15,2) DEFAULT 0.00,
  grand_total DECIMAL(15,2) DEFAULT 0.00,
  notes TEXT,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_sale_party (party_id),
  INDEX idx_sale_type (sale_type_id),
  INDEX idx_sale_status (status),
  CONSTRAINT fk_sale_party FOREIGN KEY (party_id) REFERENCES parties(id),
  CONSTRAINT fk_sale_type FOREIGN KEY (sale_type_id) REFERENCES sale_types(id),
  CONSTRAINT fk_sale_currency FOREIGN KEY (currency_id) REFERENCES currencies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT NOT NULL,
  item_id BIGINT NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  discount_percent DECIMAL(5,2) DEFAULT 0.00,
  net_price DECIMAL(15,2) NOT NULL,
  kdv_rate DECIMAL(5,2) DEFAULT 20.00,
  kdv_amount DECIMAL(15,2) DEFAULT 0.00,
  line_total DECIMAL(15,2) NOT NULL,
  description TEXT,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_si_sale (sale_id),
  INDEX idx_si_item (item_id),
  CONSTRAINT fk_si_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_si_item FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────
-- 6. PRODUCTION TABLES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS boms (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  target_item_id BIGINT,
  description TEXT,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_bom_item (target_item_id),
  CONSTRAINT fk_bom_item FOREIGN KEY (target_item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bom_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bom_id BIGINT NOT NULL,
  item_id BIGINT NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  description TEXT,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_bi_bom (bom_id),
  INDEX idx_bi_item (item_id),
  CONSTRAINT fk_bi_bom FOREIGN KEY (bom_id) REFERENCES boms(id) ON DELETE CASCADE,
  CONSTRAINT fk_bi_item FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS production_sequences (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  prefix VARCHAR(10) NOT NULL,
  current_number INT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  state TINYINT DEFAULT 1,
  UNIQUE KEY uk_prod_prefix (prefix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS production_orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  bom_id BIGINT NOT NULL,
  source_department_id BIGINT,
  target_department_id BIGINT,
  planned_quantity DECIMAL(15,4) NOT NULL,
  produced_quantity DECIMAL(15,4) DEFAULT 0.0000,
  wastage_quantity DECIMAL(15,4) DEFAULT 0.0000,
  status ENUM('draft', 'planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  state TINYINT DEFAULT 1,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_po_bom (bom_id),
  INDEX idx_po_status (status),
  CONSTRAINT fk_po_bom FOREIGN KEY (bom_id) REFERENCES boms(id),
  CONSTRAINT fk_po_src_dept FOREIGN KEY (source_department_id) REFERENCES departments(id),
  CONSTRAINT fk_po_tgt_dept FOREIGN KEY (target_department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────
-- 7. SYSTEM TABLES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS system_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  username VARCHAR(100),
  full_name VARCHAR(200),
  action VARCHAR(255) NOT NULL,
  module VARCHAR(100),
  tag VARCHAR(50) DEFAULT 'INFO',
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_log_user_id (user_id),
  INDEX idx_log_module (module),
  INDEX idx_log_tag (tag),
  INDEX idx_log_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_notes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  color VARCHAR(20) DEFAULT '#ffffff',
  is_pinned TINYINT(1) DEFAULT 0,
  state TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_un_user (user_id),
  INDEX idx_un_pinned (is_pinned),
  CONSTRAINT fk_un_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────
-- 8. PATCH existing columns if needed
-- ──────────────────────────────────────────────

-- Widen system_logs.action from 100 to 255
ALTER TABLE system_logs MODIFY COLUMN action VARCHAR(255) NOT NULL;

-- ──────────────────────────────────────────────
-- 9. SEED DATA
-- ──────────────────────────────────────────────

-- Default settings
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
  ('default_currency', 'TRY', 'Varsayılan sistem para birimi'),
  ('authorized_phone', '+90 555 555 55 55', 'Yetkili destek telefon numarası'),
  ('company_name', 'ERMAY', 'Şirket adı'),
  ('tax_office', '', 'Vergi dairesi'),
  ('tax_number', '', 'Vergi numarası'),
  ('company_address', '', 'Şirket adresi'),
  ('invoice_footer_note', '', 'Fatura alt notu');

-- Default currencies
INSERT IGNORE INTO currencies (code, name, symbol, exchange_rate, is_default) VALUES
  ('TRY', 'Türk Lirası', '₺', 1.000000, 1),
  ('USD', 'Amerikan Doları', '$', 0.029000, 0),
  ('EUR', 'Euro', '€', 0.027000, 0);

-- Default quantity types
INSERT IGNORE INTO quantity_types (name, abbreviation) VALUES
  ('Adet', 'AD'),
  ('Kilogram', 'KG'),
  ('Metre', 'MT'),
  ('Litre', 'LT'),
  ('Paket', 'PK'),
  ('Kutu', 'KT');

-- Default item types
INSERT IGNORE INTO item_types (name, abbreviation) VALUES
  ('Hammadde', 'HMD'),
  ('Mamül', 'MAM'),
  ('Yarı Mamül', 'YRM'),
  ('Ticari Mal', 'TIC'),
  ('Sarf Malzeme', 'SRF');

-- Default sale types
INSERT IGNORE INTO sale_types (name, abbreviation) VALUES
  ('Satış Faturası', 'SAT'),
  ('İade Faturası', 'IAD'),
  ('Proforma Fatura', 'PRF');

-- Permissions seed — keys must match @RequirePermissions('...') in controllers
INSERT IGNORE INTO permissions (`key`, name, module) VALUES
  -- Stok / Envanter
  ('stok_goruntuleme', 'Stok Görüntüle', 'inventory'),
  ('stok_olusturma', 'Stok Oluştur', 'inventory'),
  ('stok_duzenleme', 'Stok Düzenle', 'inventory'),
  ('stok_silme', 'Stok Sil', 'inventory'),
  -- Kullanıcılar
  ('kullanici_goruntuleme', 'Kullanıcı Görüntüle', 'users'),
  ('kullanici_olusturma', 'Kullanıcı Oluştur', 'users'),
  ('kullanici_duzenleme', 'Kullanıcı Düzenle', 'users'),
  ('kullanici_silme', 'Kullanıcı Sil', 'users'),
  -- Roller
  ('rol_goruntuleme', 'Rol Görüntüle', 'roles'),
  ('rol_olusturma', 'Rol Oluştur', 'roles'),
  ('rol_duzenleme', 'Rol Düzenle', 'roles'),
  ('rol_silme', 'Rol Sil', 'roles'),
  ('rol_atama', 'Rol Ata/Kaldır', 'roles'),
  ('yetki_atama', 'Yetki Ata', 'roles'),
  ('yetki_goruntuleme', 'Yetkileri Görüntüle', 'roles'),
  -- Departmanlar
  ('departman_goruntuleme', 'Departman Görüntüle', 'departments'),
  ('departman_olusturma', 'Departman Oluştur', 'departments'),
  ('departman_duzenleme', 'Departman Düzenle', 'departments'),
  ('departman_silme', 'Departman Sil', 'departments'),
  -- Müşteriler / Cariler
  ('musteri_goruntuleme', 'Cari Görüntüle', 'parties'),
  ('musteri_olusturma', 'Cari Oluştur', 'parties'),
  ('musteri_duzenleme', 'Cari Düzenle', 'parties'),
  ('musteri_silme', 'Cari Sil', 'parties'),
  -- Satış
  ('satis_goruntuleme', 'Satış Görüntüle', 'sales'),
  ('satis_olusturma', 'Satış Oluştur', 'sales'),
  ('satis_duzenleme', 'Satış Düzenle', 'sales'),
  ('satis_onaylama', 'Satış Onayla', 'sales'),
  ('satis_iptal', 'Satış İptal', 'sales'),
  ('satis_silme', 'Satış Sil', 'sales'),
  -- Finans
  ('finans_goruntuleme', 'Finans Görüntüle', 'finance'),
  ('finans_islem', 'Finans İşlem', 'finance'),
  ('finans_hesap_goruntuleme', 'Hesap Görüntüle', 'finance'),
  ('finans_hesap_olusturma', 'Hesap Oluştur', 'finance'),
  ('finans_hesap_duzenleme', 'Hesap Düzenle', 'finance'),
  ('finans_hesap_silme', 'Hesap Sil', 'finance'),
  -- Üretim
  ('uretim_goruntuleme', 'Üretim Görüntüle', 'production'),
  ('uretim_olusturma', 'Üretim Oluştur', 'production'),
  ('uretim_duzenleme', 'Üretim Düzenle', 'production'),
  ('uretim_silme', 'Üretim Sil', 'production'),
  -- Sistem / Ayarlar
  ('ayar_goruntuleme', 'Ayar Görüntüle', 'system'),
  ('ayar_duzenleme', 'Ayar Düzenle', 'system'),
  ('sistem_yonetimi', 'Sistem Yönetimi', 'system');

-- Default Admin role
INSERT IGNORE INTO roles (id, name) VALUES (1, 'Admin');

-- Assign ALL permissions to Admin role (id=1)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
