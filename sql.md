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
