-- ============================================================
-- ERMAY ERP — Yeni Tablolar
-- Tarih: 2026-04-08
-- Tablolar: settings, system_logs, user_notes
-- ============================================================

-- 1. SİSTEM AYARLARI (key-value yapısı)
CREATE TABLE IF NOT EXISTS settings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Varsayılan ayar kayıtları
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
  ('default_currency', 'TRY', 'Varsayılan sistem para birimi'),
  ('authorized_phone', '+90 555 555 55 55', 'Yetkili destek telefon numarası'),
  ('company_name', 'ERMAY', 'Şirket adı'),
  ('tax_office', '', 'Vergi dairesi'),
  ('tax_number', '', 'Vergi numarası'),
  ('company_address', '', 'Şirket adresi'),
  ('invoice_footer_note', '', 'Fatura alt notu');


-- 2. SİSTEM LOGLARİ (kim, ne zaman, ne yaptı)
CREATE TABLE IF NOT EXISTS system_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  username VARCHAR(100),
  full_name VARCHAR(200),
  action VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, APPROVE, CANCEL vb.',
  module VARCHAR(100) COMMENT 'sales, items, users, auth vb.',
  tag VARCHAR(50) DEFAULT 'INFO' COMMENT 'INFO, WARNING, ERROR, CRITICAL, SUCCESS',
  details TEXT COMMENT 'JSON detay bilgisi',
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_module (module),
  INDEX idx_tag (tag),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. KULLANICI NOTLARI (kişisel yapışkan notlar)
CREATE TABLE IF NOT EXISTS user_notes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  color VARCHAR(20) DEFAULT '#ffffff' COMMENT 'Not arka plan rengi',
  is_pinned TINYINT(1) DEFAULT 0 COMMENT 'Sabitlenmiş not',
  state TINYINT(1) DEFAULT 1 COMMENT '1=aktif, 0=silinmiş',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_is_pinned (is_pinned),
  CONSTRAINT fk_user_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- BU SCRIPTİ MySQL'DE ÇALIŞTIRIN:
-- mysql -u root -p benyaptim < create_tables.sql
-- ============================================================
