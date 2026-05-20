-- ERMAY ERP: Cari Tip Güncelleme Scripti
-- Amacı: 'supplier' -> 'provider' dönüşümü ve 'both' tipinin kaldırılması.

-- 1. ESKİ VERİLERİ YENİ REJİME TAŞI (Kritik!)
UPDATE parties SET type = 'provider' WHERE type = 'supplier';
UPDATE parties SET type = 'provider' WHERE type = 'both';

-- 2. ENUM tanımını güncelliyoruz.
ALTER TABLE parties MODIFY COLUMN type ENUM('customer', 'provider') NOT NULL DEFAULT 'customer';

-- Not: synchronize: true ayarı development ortamında bunu otomatik yapar, 
-- ancak production ortamı için bu scripti manuel çalıştırmak daha güvenlidir.
