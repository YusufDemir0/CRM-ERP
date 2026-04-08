-- Sütunu ekle (önceden varsa hata vermemesi için procedure kullanılabilir ama doğrudan çalıştıralım)
ALTER TABLE `items` ADD COLUMN `item_code_group_id` BIGINT NULL;

-- İndeks oluştur
CREATE INDEX `idx_item_code_group` ON `items` (`item_code_group_id`);

-- Foreign key ekle
ALTER TABLE `items` ADD CONSTRAINT `fk_item_cg` FOREIGN KEY (`item_code_group_id`) REFERENCES `item_code_groups`(`id`) ON DELETE SET NULL;
