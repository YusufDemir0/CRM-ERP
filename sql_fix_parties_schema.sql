-- ERMAY ERP: Parties Schema Fix
-- Adds missing department_id column to parties table

ALTER TABLE parties ADD COLUMN IF NOT EXISTS department_id bigint(20) DEFAULT NULL;

-- Add Foreign Key constraint (if not exists)
-- Note: MariaDB doesn't have ADD CONSTRAINT IF NOT EXISTS, so we use a safe approach
SET @dbname = DATABASE();
SET @tablename = 'parties';
SET @columnname = 'department_id';
SET @pre_query = (SELECT IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = @tablename
       AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' bigint(20) DEFAULT NULL')
));
PREPARE stmt FROM @pre_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Safe Foreign Key Addition
SET @fk_query = (SELECT IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = @tablename
       AND CONSTRAINT_NAME = 'FK_parties_department'
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT FK_parties_department FOREIGN KEY (', @columnname, ') REFERENCES departments (id) ON DELETE NO ACTION ON UPDATE NO ACTION')
));
PREPARE stmt2 FROM @fk_query;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
