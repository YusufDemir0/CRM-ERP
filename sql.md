# SQL Değişiklik Logu (SQL Change Log)

Bu dosya, proje geliştirme sürecinde veritabanında yapılan tüm şema ve veri değişikliklerini kayıt altında tutar.

---

### [2026-04-13 21:44] - Üretim Modülü Şema Güncellemesi
Üretim reçeteleri için versiyonlama ve üretim emirleri için maliyet takibi özellikleri eklendi.

```sql
-- BOMs (Reçeteler) Tablosu Güncellemeleri
ALTER TABLE boms ADD COLUMN version INT NOT NULL DEFAULT 1 AFTER target_item_id; 
ALTER TABLE boms ADD COLUMN is_active TINYINT NOT NULL DEFAULT 1 AFTER version; 

-- Production Orders (Üretim Emirleri) Tablosu Güncellemeleri
ALTER TABLE production_orders ADD COLUMN unit_cost DECIMAL(15,4) NOT NULL DEFAULT 0 AFTER status; 
ALTER TABLE production_orders ADD COLUMN total_cost DECIMAL(15,4) NOT NULL DEFAULT 0 AFTER unit_cost;
```

---

### [2026-04-13 22:04] - Departman Türleri Veri Temizliği ve Kısıtlama
Tekrarlanan kayıtlar silindi ve gelecekte oluşmasını engellemek için benzersizlik kısıtlaması (UNIQUE) eklendi.

```sql
-- Tekrarlanan (Dublicate) kayıtların silinmesi
DELETE FROM department_types WHERE id BETWEEN 5 AND 8;

-- Gelecekte tekrar etmesini önlemek için UNIQUE kısıtlaması eklenmesi
ALTER TABLE department_types ADD UNIQUE INDEX idx_unique_dept_type (name, abbreviation);
```
---

### [2026-04-13 22:15] - Ürün Türleri (Item Types) Modülü
Ürün türleri (Hammadde, Mamul vb.) yönetimi için tablo yapısı ve kısıtlamalar eklendi.

```sql
-- Ürün Türleri Tablosunun Oluşturulması (Eğer yoksa)
CREATE TABLE IF NOT EXISTS item_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(20) NOT NULL,
  state TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Benzersizlik kısıtlamasının eklenmesi
ALTER TABLE item_types ADD UNIQUE INDEX idx_unique_item_type (name, abbreviation);
```
