-- ============================================================
-- ERMAY ERP — EKSİK TABLOLAR VE YETKİLENDİRME SİSTEMİ
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. PERMISSION GROUPS (Yetki Grupları)
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

-- 2. PERMISSIONS (Yetkiler)
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
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. PERMISSION GROUP ITEMS (Grup-Yetki İlişkisi)
CREATE TABLE IF NOT EXISTS permission_group_items (
  group_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (group_id, permission_id),
  CONSTRAINT fk_prm_grp FOREIGN KEY (group_id) REFERENCES permission_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_prm_item FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ROLE PERMISSIONS (Rol Yetkileri)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_prm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_prm_item FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. USER PERMISSIONS (Kullanıcı-Özel Yetki Override)
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
  CONSTRAINT fk_user_prm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_prm_item FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. ITEM CODE GROUPS (Ürün Kod Grupları - SKU)
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

-- 7. ITEM CODE SEQUENCES (Otomatik Sayaçlar)
CREATE TABLE IF NOT EXISTS item_code_sequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_code_group_id BIGINT NOT NULL UNIQUE,
  current_number INT DEFAULT 1,
  CONSTRAINT fk_code_seq_group FOREIGN KEY (item_code_group_id) REFERENCES item_code_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. VARSAYILAN YETKİLERİ EKLEME
INSERT IGNORE INTO permissions (`key`, name, module) VALUES
  ('stok_goruntuleme', 'Stok Görüntüle', 'inventory'),
  ('stok_olusturma', 'Stok Oluştur', 'inventory'),
  ('stok_duzenleme', 'Stok Düzenle', 'inventory'),
  ('stok_silme', 'Stok Sil', 'inventory'),
  ('users:view', 'Kullanıcıları Gör', 'users'),
  ('roles:view', 'Rolleri Gör', 'roles'),
  ('departments:view', 'Departmanları Gör', 'departments'),
  ('parties:view', 'Carileri Gör', 'parties'),
  ('sales:view', 'Satışları Gör', 'sales'),
  ('accounts:view', 'Hesapları Gör', 'finance'),
  ('transactions:view', 'İşlemleri Gör', 'finance'),
  ('boms:view', 'Reçeteleri Gör', 'production'),
  ('production:view', 'Üretimi Gör', 'production'),
  ('settings:manage', 'Ayarları Yönet', 'system'),
  ('system:manage', 'Sistem Loglarını Gör', 'system');

-- Admin rolüne (varsayılan ID=1 ise) tüm yetkileri bağla
-- Rol ID'niz farklıysa burayı güncelleyin!
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

SET FOREIGN_KEY_CHECKS = 1;
