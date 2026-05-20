#!/bin/bash
# ============================================================
# Ermay ERP — Veritabanı Restore Script
# ============================================================
# Kullanım: bash restore_db.sh
# ============================================================

set -e

cd "$(dirname "$0")"

echo "=========================================="
echo " Ermay ERP - Veritabanı Restore"
echo "=========================================="

# --- Adım 1: DB Container'ı başlat ---
echo ""
echo "[1/5] MariaDB container başlatılıyor..."
docker compose up -d db

echo ""
echo "[2/5] Container healthy olana kadar bekleniyor..."
for i in $(seq 1 30); do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' ermay-db 2>/dev/null || echo "starting")
    if [ "$STATUS" = "healthy" ]; then
        echo "  ✅ MariaDB hazır!"
        break
    fi
    echo "  ⏳ Bekleniyor... ($i/30) status=$STATUS"
    sleep 3
done

# Emin olmak için bir 5 saniye daha bekle
sleep 5

# --- Adım 2: Database oluştur ---
echo ""
echo "[3/5] ERPCRMDB veritabanı oluşturuluyor..."
mariadb -h 127.0.0.1 -P 3306 -u root -permay_root_2026 -e \
  "CREATE DATABASE IF NOT EXISTS ERPCRMDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

mariadb -h 127.0.0.1 -P 3306 -u root -permay_root_2026 -e \
  "GRANT ALL PRIVILEGES ON ERPCRMDB.* TO 'erp_user'@'%'; FLUSH PRIVILEGES;"

echo "  ✅ ERPCRMDB oluşturuldu ve erp_user yetkilendirildi!"

# --- Adım 3: Dump import ---
echo ""
echo "[4/5] dump.sql import ediliyor..."
mariadb -h 127.0.0.1 -P 3306 -u root -permay_root_2026 ERPCRMDB \
  < backend/src/database/migrations/dump.sql

echo "  ✅ Dump başarıyla import edildi!"

# --- Adım 3.5: Eksik kolonları ekle (dump eski olabilir) ---
echo ""
echo "[4/5] Eksik kolonlar kontrol ediliyor..."
mariadb -h 127.0.0.1 -P 3306 -u root -permay_root_2026 ERPCRMDB -e "
  SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='ERPCRMDB' AND TABLE_NAME='users' AND COLUMN_NAME='refresh_token_hash');
  SET @s = IF(@col = 0, 'ALTER TABLE users ADD COLUMN refresh_token_hash varchar(255) DEFAULT NULL AFTER password_hash', 'SELECT 1');
  PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
"
echo "  ✅ Kolon kontrolleri tamamlandı!"

# --- Adım 4: Orphan data düzelt ---
echo ""
echo "[4.5/5] Orphan data düzeltiliyor..."
mariadb -h 127.0.0.1 -P 3306 -u root -permay_root_2026 ERPCRMDB -e "
  -- staff id=1 department_id=13 -> departments'ta yok, 4'e çek
  UPDATE staff SET department_id = 4 WHERE id = 1 AND department_id = 13;
  -- orphan user_permissions user_id=4 -> users'da yok
  DELETE FROM user_permissions WHERE user_id NOT IN (SELECT id FROM users);
"
echo "  ✅ Orphan kayıtlar düzeltildi!"

# --- Adım 5: Doğrulama ---
echo ""
echo "[5/5] Doğrulama sorguları çalıştırılıyor..."
echo ""
mariadb -h 127.0.0.1 -P 3306 -u erp_user -permay_db_2026 ERPCRMDB -e "
  SELECT 'TABLOLAR' AS kontrol, COUNT(*) AS sayi FROM information_schema.tables WHERE table_schema='ERPCRMDB'
  UNION ALL SELECT 'users', COUNT(*) FROM users
  UNION ALL SELECT 'items', COUNT(*) FROM items
  UNION ALL SELECT 'departments', COUNT(*) FROM departments
  UNION ALL SELECT 'parties', COUNT(*) FROM parties
  UNION ALL SELECT 'stocks', COUNT(*) FROM stocks
  UNION ALL SELECT 'staff', COUNT(*) FROM staff
  UNION ALL SELECT 'roles', COUNT(*) FROM roles
  UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
  UNION ALL SELECT 'currencies', COUNT(*) FROM currencies
  UNION ALL SELECT 'boms', COUNT(*) FROM boms
  UNION ALL SELECT 'commercial_accounts', COUNT(*) FROM commercial_accounts;
"

echo ""
echo "=========================================="
echo " ✅ Veritabanı restore tamamlandı!"
echo "=========================================="
echo ""
echo "Tüm servisleri başlatmak için:"
echo "  docker compose up -d"
echo ""
