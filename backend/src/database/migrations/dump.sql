/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.2.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: benyaptim
-- ------------------------------------------------------
-- Server version	12.2.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `accounting_ledger`
--

DROP TABLE IF EXISTS `accounting_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounting_ledger` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `state` tinyint(4) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `date` date NOT NULL,
  `party_id` bigint(20) NOT NULL,
  `account_id` bigint(20) DEFAULT NULL,
  `debit` decimal(18,2) NOT NULL DEFAULT 0.00,
  `credit` decimal(18,2) NOT NULL DEFAULT 0.00,
  `transaction_id` int(11) DEFAULT NULL,
  `source` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_c0ef30e23ef0bdf9a5b64170d1` (`party_id`,`date`),
  KEY `FK_63319b4f79ac900cffff20f9538` (`account_id`),
  CONSTRAINT `FK_4eb1e0e84a09a8f9b419113ad47` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_63319b4f79ac900cffff20f9538` FOREIGN KEY (`account_id`) REFERENCES `commercial_accounts` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounting_ledger`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `accounting_ledger` WRITE;
/*!40000 ALTER TABLE `accounting_ledger` DISABLE KEYS */;
INSERT INTO `accounting_ledger` VALUES
(1,1,NULL,'2026-04-22 10:58:50.839040',NULL,'2026-04-22 10:58:50.839040',NULL,'2026-04-22',6,NULL,24000.00,0.00,1,'SALE','S-MADA-001 numaralı Satış Faturası Borçlandırması'),
(2,1,NULL,'2026-04-22 11:04:41.199899',NULL,'2026-04-22 11:04:41.199899',NULL,'2026-04-22',6,NULL,24000.00,0.00,9001,'SALE','S-GEN-0009000 numaralı Satış Faturası Borçlandırması');
/*!40000 ALTER TABLE `accounting_ledger` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `entity_name` varchar(100) NOT NULL,
  `entity_id` bigint(20) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `old_values` text DEFAULT NULL,
  `new_values` text DEFAULT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_4057c4849108f6d6ccb77a4e91` (`entity_name`),
  KEY `IDX_85c204d8e47769ac183b32bf9c` (`entity_id`),
  KEY `IDX_bd2726fd31b35443f2245b93ba` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=263 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `bom_items`
--

DROP TABLE IF EXISTS `bom_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bom_items` (
  `bom_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `quantity` decimal(15,4) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  PRIMARY KEY (`bom_id`,`item_id`),
  KEY `FK_1636fe5f2447ef2837c1bd6034a` (`item_id`),
  CONSTRAINT `FK_1636fe5f2447ef2837c1bd6034a` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_c982fd6310ed1543689a0208d94` FOREIGN KEY (`bom_id`) REFERENCES `boms` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bom_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `bom_items` WRITE;
/*!40000 ALTER TABLE `bom_items` DISABLE KEYS */;
INSERT INTO `bom_items` VALUES
(1,17,1.0000,'',1,'2026-04-22 09:27:24',NULL,'2026-04-22 09:27:24',NULL),
(1,18,2.0000,'',1,'2026-04-22 09:27:24',NULL,'2026-04-22 09:27:24',NULL),
(2,17,1.0000,'',1,'2026-04-22 09:27:44',NULL,'2026-04-22 09:27:44',NULL),
(2,18,2.0000,'',1,'2026-04-22 09:27:44',NULL,'2026-04-22 09:27:44',NULL),
(3,24,1.0000,'',1,'2026-04-22 09:29:02',NULL,'2026-04-22 09:29:02',NULL),
(3,25,2.0000,'',1,'2026-04-22 09:29:02',NULL,'2026-04-22 09:29:02',NULL),
(4,19,1.0000,'',1,'2026-04-22 09:31:08',NULL,'2026-04-22 09:31:08',NULL),
(4,20,1.0000,'',1,'2026-04-22 09:31:08',NULL,'2026-04-22 09:31:08',NULL),
(4,21,1.0000,'',1,'2026-04-22 09:31:08',NULL,'2026-04-22 09:31:08',NULL),
(4,22,1.0000,'',1,'2026-04-22 09:31:08',NULL,'2026-04-22 09:31:08',NULL),
(5,25,1.0000,'',1,'2026-04-22 13:06:49',NULL,'2026-04-22 13:06:49',NULL);
/*!40000 ALTER TABLE `bom_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boms`
--

DROP TABLE IF EXISTS `boms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boms` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `target_item_id` bigint(20) DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `FK_6ca39aed125da07cb280352c6da` (`target_item_id`),
  CONSTRAINT `FK_6ca39aed125da07cb280352c6da` FOREIGN KEY (`target_item_id`) REFERENCES `items` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boms`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boms` WRITE;
/*!40000 ALTER TABLE `boms` DISABLE KEYS */;
INSERT INTO `boms` VALUES
(1,'ÜÇGEN MÜDÜR',24,1,1,NULL,1,'2026-04-22 09:27:24.082516',NULL,'2026-04-22 09:27:24.082516',NULL,1),
(2,'ÜÇGEN MİSAFİR',25,1,0,NULL,1,'2026-04-22 09:27:44.934787',NULL,'2026-04-22 13:06:49.000000',NULL,1),
(3,'ÜÇGEN TAKIM',26,1,1,NULL,1,'2026-04-22 09:29:02.339293',NULL,'2026-04-22 09:29:02.339293',NULL,1),
(4,'TUNA TAKIM',23,1,1,NULL,1,'2026-04-22 09:31:08.931366',NULL,'2026-04-22 09:31:08.931366',NULL,1),
(5,'ÜÇGEN MİSAFİR',25,2,1,NULL,1,'2026-04-22 13:06:49.384623',1,'2026-04-22 13:06:54.000000',NULL,0);
/*!40000 ALTER TABLE `boms` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `commercial_accounts`
--

DROP TABLE IF EXISTS `commercial_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `commercial_accounts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `iban` varchar(34) DEFAULT NULL,
  `iban_name` varchar(100) DEFAULT NULL,
  `currency_id` bigint(20) NOT NULL,
  `critical_limit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `FK_eaa50c28386cae9d72e18ed1a1e` (`currency_id`),
  CONSTRAINT `FK_eaa50c28386cae9d72e18ed1a1e` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commercial_accounts`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `commercial_accounts` WRITE;
/*!40000 ALTER TABLE `commercial_accounts` DISABLE KEYS */;
INSERT INTO `commercial_accounts` VALUES
(1,'İZMİT KASA','KUVEYT TÜRK','TR94 0006 2000 2240 0006 8905 35','MEHMET ERBAY',1,140000.00,'bayram karaca',1,'2026-04-01 18:41:47.000000',1,'2026-04-16 02:22:58.000000',NULL,1),
(2,'SAKARYA KASA','KUVEYTTÜRK','TR12 3123 1231 2321 3123 1231 23','BEDIRHAN INAL',1,100000.00,'SAKARYA KASA SORUMLU SEZER',1,'2026-04-07 18:42:01.018434',1,'2026-04-16 02:23:05.000000',NULL,1),
(3,'ÇORLU KASA','QNB FINANS','TR11 1111 1111 1111 1111 1111 11','MEHMET ERBAY QNB',1,50000.00,'ÖMER ÇORLU KASA',1,'2026-04-07 18:44:48.555329',NULL,'2026-04-07 18:44:48.555329',NULL,1),
(4,'IST DEPO KASA(ISM)','NAKIT','TR22 2222 2222 2222 2222 2222 22','ISMAIL ŞAHIN',1,30000.00,'ISMAIL ŞAHIN SORUMLU',1,'2026-04-07 18:46:55.283074',NULL,'2026-04-07 18:46:55.283074',NULL,1),
(5,'ANA KASA ( MUSTAFA)','QNB ENPARA','TR12 2314 1141 2412 4124 1241 41','MEHMET ERBAY',1,1000000.00,'MUSTAFA ERBAY ANA KASA',1,'2026-04-11 18:44:44.297738',1,'2026-04-16 02:22:45.000000',NULL,1);
/*!40000 ALTER TABLE `commercial_accounts` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `currencies` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` char(3) NOT NULL,
  `name` varchar(50) NOT NULL,
  `symbol` varchar(10) NOT NULL,
  `exchange_rate` decimal(15,6) NOT NULL DEFAULT 1.000000,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_9f8d0972aeeb5a2277e40332d2` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currencies`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
INSERT INTO `currencies` VALUES
(1,'TRY','Türk Lirası','₺',1.000000,1,NULL,'2026-03-30 15:36:21.000000',1,'2026-04-21 18:22:28.000000',NULL,1),
(2,'USD','Amerikan Doları','$',0.000000,0,NULL,'2026-03-30 15:36:21.000000',NULL,'2026-04-21 18:22:28.000000',NULL,1),
(3,'EUR','Euro','€',0.000000,0,NULL,'2026-03-30 15:36:21.000000',1,'2026-04-21 18:22:28.000000',NULL,1),
(6,'ASS','ASSS','ß',1.000000,0,1,'2026-04-16 02:15:31.868687',NULL,'2026-04-21 18:22:28.000000',NULL,1);
/*!40000 ALTER TABLE `currencies` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `department_types`
--

DROP TABLE IF EXISTS `department_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_types` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `abbreviation` varchar(20) NOT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `department_types` WRITE;
/*!40000 ALTER TABLE `department_types` DISABLE KEYS */;
INSERT INTO `department_types` VALUES
(1,'Üretim','URT',NULL,'2026-04-04 12:30:38.000000',NULL,'2026-04-04 12:30:38.000000',NULL,1),
(2,'Satış','STS',NULL,'2026-04-04 12:30:38.000000',NULL,'2026-04-04 12:30:38.000000',NULL,1),
(3,'Depo','DEP',NULL,'2026-04-04 12:30:38.000000',NULL,'2026-04-04 12:30:38.000000',NULL,1),
(4,'İdari','IDR',NULL,'2026-04-04 12:30:38.000000',NULL,'2026-04-13 19:04:08.000000','2026-04-13 19:04:08.000000',1),
(9,'TESTT','TTT',1,'2026-04-16 02:14:46.203795',NULL,'2026-04-16 02:14:46.203795',NULL,1);
/*!40000 ALTER TABLE `department_types` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `abbreviation` varchar(20) DEFAULT NULL,
  `department_type_id` bigint(20) DEFAULT NULL,
  `commercial_account_id` bigint(20) DEFAULT NULL,
  `city_id` int(11) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `FK_ec6ae50ee271729553c69276ba0` (`department_type_id`),
  KEY `FK_f3a5c41b9e812b5150c41ec8394` (`commercial_account_id`),
  CONSTRAINT `FK_ec6ae50ee271729553c69276ba0` FOREIGN KEY (`department_type_id`) REFERENCES `department_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_f3a5c41b9e812b5150c41ec8394` FOREIGN KEY (`commercial_account_id`) REFERENCES `commercial_accounts` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES
(3,'izmit depoKKKW','İZMİT DEPO - ( MOPAŞ )QQQW','DİZMQQQW',NULL,NULL,NULL,1,'2026-04-01 18:24:39.000000',1,'2026-04-04 11:56:15.000000','2026-04-04 11:56:15.000000',1),
(4,'SAKARYA MAĞAZA','SEZER SAKARYA','MADA',2,2,NULL,1,'2026-04-07 18:43:09.300894',NULL,'2026-04-07 18:43:09.300894',NULL,1),
(5,'ÇORLU MAĞAZA','ÖMER SORUMLU','MCOR',2,3,NULL,1,'2026-04-07 18:45:12.731921',1,'2026-04-16 17:15:04.000000',NULL,1),
(6,'MERKEZ DEPO(IST)','ISMAIL ŞAHIN','DIST',2,4,NULL,1,'2026-04-07 18:47:38.890289',1,'2026-04-11 18:36:10.000000',NULL,1),
(10,'İZMİT MAĞAZA','BAYRAM KARACA','MERM',2,1,NULL,1,'2026-04-11 18:30:24.632395',1,'2026-04-16 02:23:34.000000',NULL,1);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `item_code_groups`
--

DROP TABLE IF EXISTS `item_code_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_code_groups` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `prefix` varchar(10) NOT NULL,
  `state` tinyint(4) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_9ddb9ef4d5af909cb713838954` (`prefix`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_code_groups`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `item_code_groups` WRITE;
/*!40000 ALTER TABLE `item_code_groups` DISABLE KEYS */;
INSERT INTO `item_code_groups` VALUES
(1,'MOBİLYA','MOB',1,1,'2026-04-08 22:18:18.000000',NULL,'2026-04-08 22:18:18.000000',NULL),
(2,'MOBBO','MOO',0,1,'2026-04-16 02:15:18.474442',1,'2026-04-22 09:17:01.000000',NULL),
(3,'KOLTUK','KLT',1,1,'2026-04-22 09:17:59.044426',NULL,'2026-04-22 09:17:59.044426',NULL),
(4,'KANEPE','KNP',1,1,'2026-04-22 09:18:06.697218',NULL,'2026-04-22 09:18:06.697218',NULL),
(5,'HAMMADDE','HMD',1,1,'2026-04-22 09:18:16.483105',NULL,'2026-04-22 09:18:16.483105',NULL);
/*!40000 ALTER TABLE `item_code_groups` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `item_code_sequences`
--

DROP TABLE IF EXISTS `item_code_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_code_sequences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_code_group_id` bigint(20) NOT NULL,
  `current_number` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_64c5ee66ef104a2bb17d3d1fe2` (`item_code_group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_code_sequences`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `item_code_sequences` WRITE;
/*!40000 ALTER TABLE `item_code_sequences` DISABLE KEYS */;
INSERT INTO `item_code_sequences` VALUES
(1,1,11),
(2,2,3),
(6,5,2),
(13,3,3);
/*!40000 ALTER TABLE `item_code_sequences` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `item_sequences`
--

DROP TABLE IF EXISTS `item_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_sequences` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `item_type_id` bigint(20) NOT NULL,
  `current_number` int(11) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_65605f270f213f2147d7a7ad8e` (`item_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_sequences`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `item_sequences` WRITE;
/*!40000 ALTER TABLE `item_sequences` DISABLE KEYS */;
INSERT INTO `item_sequences` VALUES
(1,1,6,1,'2026-03-31 16:28:21',NULL,'2026-04-01 19:20:33',NULL,1),
(2,2,1,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1),
(3,3,1,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1),
(4,4,1,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1);
/*!40000 ALTER TABLE `item_sequences` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `item_types`
--

DROP TABLE IF EXISTS `item_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_types` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `abbreviation` varchar(20) NOT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  `is_excluded_from_bom` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `item_types` WRITE;
/*!40000 ALTER TABLE `item_types` DISABLE KEYS */;
INSERT INTO `item_types` VALUES
(1,'Hammadde','HMD',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1,0),
(4,'Ticari Mamül','TCM',1,'2026-03-31 16:28:21.000000',1,'2026-04-22 12:44:05.000000',NULL,1,1),
(17,'Ara Mamül','ARM',1,'2026-04-22 12:02:05.692690',NULL,'2026-04-22 12:02:15.161630',NULL,1,0);
/*!40000 ALTER TABLE `item_types` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `item_type_id` bigint(20) NOT NULL,
  `code` varchar(50) NOT NULL,
  `provider_id` bigint(20) DEFAULT NULL,
  `critical_limit` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `image` varchar(255) DEFAULT NULL,
  `purchase_price` decimal(15,2) DEFAULT NULL,
  `moving_average_cost` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `sale_price` decimal(15,2) DEFAULT NULL,
  `net_price` decimal(15,2) DEFAULT NULL,
  `currency_id` bigint(20) DEFAULT NULL,
  `quantity_type_id` bigint(20) NOT NULL,
  `kdv` decimal(5,2) NOT NULL DEFAULT 20.00,
  `total_stock` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `description` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  `code1` varchar(50) DEFAULT NULL,
  `code2` varchar(50) DEFAULT NULL,
  `item_code_group_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_93f02a9196a53d0f4b2412aa42c` (`item_type_id`),
  KEY `FK_b57597a0f63c67d287482179bd3` (`quantity_type_id`),
  KEY `FK_46f820d035883abd222af4e1bc9` (`item_code_group_id`),
  KEY `FK_de7d03999d028482299f18feca8` (`provider_id`),
  KEY `FK_233b596fc5b2424beb1f2f82ba8` (`currency_id`),
  CONSTRAINT `FK_233b596fc5b2424beb1f2f82ba8` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_46f820d035883abd222af4e1bc9` FOREIGN KEY (`item_code_group_id`) REFERENCES `item_code_groups` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_93f02a9196a53d0f4b2412aa42c` FOREIGN KEY (`item_type_id`) REFERENCES `item_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_b57597a0f63c67d287482179bd3` FOREIGN KEY (`quantity_type_id`) REFERENCES `quantity_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_de7d03999d028482299f18feca8` FOREIGN KEY (`provider_id`) REFERENCES `parties` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES
(2,'kavanoz',1,'HMD-002',NULL,0.0000,NULL,41.00,0.0000,NULL,NULL,3,2,20.00,0.0000,NULL,NULL,1,'2026-04-01 17:52:54.000000',NULL,'2026-04-01 19:16:11.000000','2026-04-01 19:16:11.000000',1,NULL,NULL,NULL),
(17,'ÜÇGEN AĞAÇ',1,'HMD-001',NULL,100.0000,'',2500.00,0.0000,5000.00,NULL,1,1,20.00,0.0000,'ÜÇGEN-SUDE İSKELETİ','',1,'2026-04-22 09:19:39.566348',NULL,'2026-04-22 09:19:39.566348',NULL,1,NULL,NULL,5),
(18,'ÜÇGEN KOL',1,'HMD-002',NULL,100.0000,'',1500.00,0.0000,3000.00,NULL,1,1,10.00,0.0000,'ÜÇGEN KOL ADET','',1,'2026-04-22 09:20:51.989303',NULL,'2026-04-22 09:20:51.989303',NULL,1,NULL,NULL,5),
(19,'TUNA MASA',17,'MOB-007',NULL,10.0000,'',3000.00,0.0000,6000.00,NULL,1,1,10.00,0.0000,'TUNA MASA','',1,'2026-04-22 09:21:56.732742',1,'2026-04-22 13:03:15.000000',NULL,1,NULL,NULL,1),
(20,'TUNA DOLAP',17,'MOB-008',NULL,10.0000,'',2000.00,0.0000,4000.00,NULL,1,1,20.00,0.0000,'TUNA DOLAP','',1,'2026-04-22 09:22:29.445846',1,'2026-04-22 13:03:01.000000',NULL,1,NULL,NULL,1),
(21,'TUNA ETEJER',17,'MOB-009',NULL,10.0000,'',1500.00,0.0000,3000.00,NULL,1,1,20.00,0.0000,'TUNA ETEJER','',1,'2026-04-22 09:22:57.065982',1,'2026-04-22 13:03:08.000000',NULL,1,NULL,NULL,1),
(22,'TUNA SEHPQ',17,'MOB-010',NULL,10.0000,'',1500.00,0.0000,3000.00,NULL,1,1,20.00,0.0000,'TUNA SEHPQ','',1,'2026-04-22 09:24:01.353692',1,'2026-04-22 13:03:21.000000',NULL,1,NULL,NULL,1),
(23,'TUNA TAKIM',4,'MOB-011',NULL,10.0000,'',7000.00,0.0000,10500.00,NULL,1,1,20.00,0.0000,'','',1,'2026-04-22 09:25:04.524772',NULL,'2026-04-22 09:25:04.524772',NULL,1,NULL,NULL,1),
(24,'ÜÇGEN MÜDÜR',17,'KLT-001',NULL,10.0000,'',3750.00,0.0000,7000.00,NULL,1,1,20.00,0.0000,'','',1,'2026-04-22 09:25:39.013236',1,'2026-04-22 13:03:39.000000',NULL,1,NULL,NULL,3),
(25,'ÜÇGEN MİSAFİR',17,'KLT-002',NULL,10.0000,'',2500.00,0.0000,4000.00,NULL,1,1,20.00,0.0000,'','',1,'2026-04-22 09:26:23.485960',1,'2026-04-22 13:03:32.000000',NULL,1,NULL,NULL,3),
(26,'ÜÇGEN TAKIM',4,'KLT-003',NULL,10.0000,'',9000.00,0.0000,13500.00,NULL,1,1,20.00,0.0000,'','',1,'2026-04-22 09:28:27.349678',NULL,'2026-04-22 09:28:27.349678',NULL,1,NULL,NULL,3);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
(1,1776163392163,'Baseline1776163392163'),
(2,1776163392164,'AddPerformanceIndexes1776163392164'),
(3,1776163392165,'AddTokenVersionToUsers1776163392165'),
(4,1776163392166,'AddIsSystemAdminToRoles1776163392166'),
(5,1776163392167,'GrantAdminSystemPrivileges1776163392167'),
(6,1776163392168,'AddManualToTransactionReferenceType1776163392168'),
(7,1776163392169,'CreateAuditLog1776163392169'),
(8,1776163392170,'HardenUsersAndFixAudit1776163392170'),
(9,1776163392171,'SyncMissingColumns1776163392171'),
(10,1776163392172,'SyncSaleItemsColumns1776163392172'),
(11,1776163392173,'RepairSchemaGaps1776163392173'),
(12,1776163392174,'AddStaffIdToSales1776163392174'),
(13,1776163392174,'AddDepartmentIdToSaleSequences1776163392174'),
(14,1776163392175,'AddDepartmentIdToSaleSequences1776163392175'),
(15,1776163392176,'AddItemTypeBomExclusion1776163392176');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `parties`
--

DROP TABLE IF EXISTS `parties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `parties` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `type` enum('customer','provider','both') NOT NULL DEFAULT 'customer',
  `name` varchar(150) NOT NULL,
  `phone1` varchar(20) DEFAULT NULL,
  `phone2` varchar(20) DEFAULT NULL,
  `tax_office` varchar(100) DEFAULT NULL,
  `tax_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city_id` int(11) DEFAULT NULL,
  `district_name` varchar(100) DEFAULT NULL,
  `balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit_limit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_terms` varchar(50) DEFAULT NULL,
  `currency_id` bigint(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `FK_ec10d8b82ab62f336df1c32a061` (`currency_id`),
  CONSTRAINT `FK_ec10d8b82ab62f336df1c32a061` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parties`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `parties` WRITE;
/*!40000 ALTER TABLE `parties` DISABLE KEYS */;
INSERT INTO `parties` VALUES
(2,'provider','AHMET DEMİR','0 (541) 561 25 10','0 (541) 561 25 10',NULL,'1234567891','bedo@bedo.com','KOCAELİ / İZMİT / YEŞİLOVA',NULL,NULL,0.00,50000.00,'',1,'',1,'2026-04-07 19:11:31.245894',1,'2026-04-07 19:21:05.000000',NULL,1),
(3,'customer','VELINIMET BAHTIYAR','0 (231) 231 23 12','',NULL,'64666464646','qwe@qwe.com','IST / MALTEĞE',NULL,NULL,5633.00,25000.00,'',1,'',1,'2026-04-07 19:58:54.493945',1,'2026-04-21 19:21:03.000000',NULL,1),
(6,'customer','ALİ OSMAN KÖR','+90 533 052 70 46','+90 ',NULL,NULL,NULL,'',41,'İZMIT',48000.00,0.00,NULL,1,'',1,'2026-04-22 09:42:33.344589',1,'2026-04-22 11:04:41.000000',NULL,1);
/*!40000 ALTER TABLE `parties` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `permission_group_items`
--

DROP TABLE IF EXISTS `permission_group_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_group_items` (
  `group_id` bigint(20) NOT NULL,
  `permission_id` bigint(20) NOT NULL,
  PRIMARY KEY (`group_id`,`permission_id`),
  KEY `IDX_df02b6c1b2d13ecfd325ff9ce0` (`group_id`),
  KEY `IDX_9202047314fcdb85dbc797f6a1` (`permission_id`),
  CONSTRAINT `FK_9202047314fcdb85dbc797f6a12` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_df02b6c1b2d13ecfd325ff9ce06` FOREIGN KEY (`group_id`) REFERENCES `permission_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_group_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `permission_group_items` WRITE;
/*!40000 ALTER TABLE `permission_group_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `permission_group_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `permission_groups`
--

DROP TABLE IF EXISTS `permission_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_groups` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_groups`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `permission_groups` WRITE;
/*!40000 ALTER TABLE `permission_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `permission_groups` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  `action` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_017943867ed5ceef9c03edd974` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES
(1,'SYS.ALL','Tam Yetki','Sistem',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1,NULL),
(2,'SALES_VIEW','Satış Görüntüleme','Satış',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1,NULL),
(3,'SALES_CREATE','Satış Oluşturma','Satış',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1,NULL),
(4,'INVENTORY_VIEW','Stok Görüntüle','inventory',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(5,'INVENTORY_CREATE','Stok Oluştur','inventory',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(6,'INVENTORY_EDIT','Stok Düzenle','inventory',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(7,'INVENTORY_DELETE','Stok Sil','inventory',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(8,'USER_VIEW','Kullanıcı Görüntüle','users',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(9,'USER_CREATE','Kullanıcı Oluştur','users',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(10,'USER_EDIT','Kullanıcı Düzenle','users',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(11,'USER_DELETE','Kullanıcı Sil','users',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(12,'ROLE_VIEW','Rol Görüntüle','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(13,'ROLE_CREATE','Rol Oluştur','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(14,'ROLE_EDIT','Rol Düzenle','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(15,'ROLE_DELETE','Rol Sil','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(16,'ROLE_ASSIGN','Rol Ata/Kaldır','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(17,'PERMISSION_ASSIGN','Yetki Ata','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(18,'PERMISSION_VIEW','Yetkileri Görüntüle','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(19,'DEPARTMENT_VIEW','Departman Görüntüle','departments',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(20,'DEPARTMENT_CREATE','Departman Oluştur','departments',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(21,'DEPARTMENT_EDIT','Departman Düzenle','departments',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(22,'DEPARTMENT_DELETE','Departman Sil','departments',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(23,'CUSTOMER_VIEW','Cari Görüntüle','parties',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(24,'CUSTOMER_CREATE','Cari Oluştur','parties',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(25,'CUSTOMER_EDIT','Cari Düzenle','parties',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(26,'CUSTOMER_DELETE','Cari Sil','parties',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(27,'SALES_VIEW_2','Satış Görüntüle','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(28,'SALES_CREATE_2','Satış Oluştur','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(29,'SALES_EDIT','Satış Düzenle','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(30,'SALES_APPROVE','Satış Onayla','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(31,'SALES_CANCEL','Satış İptal','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(32,'SALES_DELETE','Satış Sil','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(33,'FINANCE_VIEW','Finans Görüntüle','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(34,'FINANCE_MANAGE','Finans İşlem','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(35,'FINANCE_ACCOUNT_VIEW','Hesap Görüntüle','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(36,'FINANCE_ACCOUNT_CREATE','Hesap Oluştur','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(37,'FINANCE_ACCOUNT_EDIT','Hesap Düzenle','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(38,'FINANCE_ACCOUNT_DELETE','Hesap Sil','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(39,'PRODUCTION_VIEW','Üretim Görüntüle','production',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(40,'PRODUCTION_CREATE','Üretim Oluştur','production',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(41,'PRODUCTION_EDIT','Üretim Düzenle','production',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(42,'PRODUCTION_DELETE','Üretim Sil','production',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(43,'SYSTEM_VIEW','Ayar Görüntüle','system',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(44,'SYSTEM_EDIT','Ayar Düzenle','system',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(45,'SYSTEM_MANAGE','Sistem Yönetimi','system',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1,NULL),
(46,'SYSTEM_MANAGE_2','Sistem Yönetimi','system',NULL,'2026-04-16 02:13:38.000000',NULL,'2026-04-16 02:13:38.000000',NULL,1,NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `production_orders`
--

DROP TABLE IF EXISTS `production_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_orders` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `bom_id` bigint(20) NOT NULL,
  `source_department_id` bigint(20) DEFAULT NULL,
  `target_department_id` bigint(20) DEFAULT NULL,
  `planned_quantity` decimal(15,4) NOT NULL,
  `produced_quantity` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `wastage_quantity` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `status` enum('draft','planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  `unit_cost` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `total_cost` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `labor_cost` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `overhead_cost` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_be306d9b0945e8ad058743c4bb` (`code`),
  KEY `FK_22d2520dd41c0d6a58b511af20a` (`bom_id`),
  KEY `FK_37588e2b70af854479297e75c1f` (`source_department_id`),
  KEY `FK_7115e52dcc8df6dfe4ded262dcf` (`target_department_id`),
  CONSTRAINT `FK_22d2520dd41c0d6a58b511af20a` FOREIGN KEY (`bom_id`) REFERENCES `boms` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_37588e2b70af854479297e75c1f` FOREIGN KEY (`source_department_id`) REFERENCES `departments` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_7115e52dcc8df6dfe4ded262dcf` FOREIGN KEY (`target_department_id`) REFERENCES `departments` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_orders`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `production_orders` WRITE;
/*!40000 ALTER TABLE `production_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_orders` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `production_sequences`
--

DROP TABLE IF EXISTS `production_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_sequences` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `prefix` varchar(10) NOT NULL,
  `current_number` int(11) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_166bb336d0680c137ef6638396` (`prefix`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_sequences`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `production_sequences` WRITE;
/*!40000 ALTER TABLE `production_sequences` DISABLE KEYS */;
INSERT INTO `production_sequences` VALUES
(1,'URT',3,1,'2026-03-31 16:28:21',NULL,'2026-04-01 19:39:39',NULL,1);
/*!40000 ALTER TABLE `production_sequences` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `quantity_types`
--

DROP TABLE IF EXISTS `quantity_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quantity_types` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `abbreviation` varchar(10) NOT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quantity_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `quantity_types` WRITE;
/*!40000 ALTER TABLE `quantity_types` DISABLE KEYS */;
INSERT INTO `quantity_types` VALUES
(1,'Adet','AD',NULL,'2026-03-30 15:36:21.000000',NULL,'2026-03-30 15:36:21.000000',NULL,1),
(2,'Kilogram','KG',NULL,'2026-03-30 15:36:21.000000',NULL,'2026-03-30 15:36:21.000000',NULL,1),
(3,'Gram','GR',NULL,'2026-03-30 15:36:21.000000',NULL,'2026-03-30 15:36:21.000000',NULL,1),
(4,'Litre','LT',NULL,'2026-03-30 15:36:21.000000',NULL,'2026-03-30 15:36:21.000000',NULL,1),
(5,'Metre','MT',NULL,'2026-03-30 15:36:21.000000',NULL,'2026-04-13 19:02:51.000000','2026-04-13 19:02:51.000000',1),
(6,'Paket','PK',NULL,'2026-03-30 15:36:21.000000',NULL,'2026-03-30 15:36:21.000000',NULL,1),
(7,'Kutu','KT',NULL,'2026-03-30 15:36:21.000000',NULL,'2026-03-30 15:36:21.000000',NULL,1),
(9,'Kilogram','KG',NULL,'2026-04-08 22:11:26.678117',1,'2026-04-13 19:02:19.000000','2026-04-13 19:02:19.000000',1),
(10,'Metre','MT',NULL,'2026-04-08 22:11:26.678117',1,'2026-04-13 19:02:46.000000','2026-04-13 19:02:46.000000',1),
(11,'Litre','LT',NULL,'2026-04-08 22:11:26.678117',NULL,'2026-04-08 22:11:26.678117',NULL,1),
(12,'Paket','PK',NULL,'2026-04-08 22:11:26.678117',1,'2026-04-13 18:55:38.000000',NULL,1),
(13,'Kutu','KT',NULL,'2026-04-08 22:11:26.678117',NULL,'2026-04-11 17:20:49.000000','2026-04-11 17:20:49.000000',1);
/*!40000 ALTER TABLE `quantity_types` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint(20) NOT NULL,
  `permission_id` bigint(20) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `IDX_178199805b901ccd220ab7740e` (`role_id`),
  KEY `IDX_17022daf3f885f7d35423e9971` (`permission_id`),
  CONSTRAINT `FK_17022daf3f885f7d35423e9971e` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_178199805b901ccd220ab7740ec` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES
(1,1),
(1,2),
(1,3),
(1,4),
(1,5),
(1,6),
(1,7),
(1,8),
(1,9),
(1,10),
(1,11),
(1,12),
(1,13),
(1,14),
(1,15),
(1,16),
(1,17),
(1,18),
(1,19),
(1,20),
(1,21),
(1,22),
(1,23),
(1,24),
(1,25),
(1,26),
(1,27),
(1,28),
(1,29),
(1,30),
(1,31),
(1,32),
(1,33),
(1,34),
(1,35),
(1,36),
(1,37),
(1,38),
(1,39),
(1,40),
(1,41),
(1,42),
(1,43),
(1,44),
(1,45),
(1,46),
(2,2),
(2,3),
(2,4),
(2,19),
(2,23),
(2,27),
(2,35),
(2,39),
(3,33),
(3,34),
(3,37),
(4,2),
(4,4),
(4,8),
(4,12),
(4,18),
(4,19),
(4,23),
(4,27),
(4,33),
(4,35),
(4,39),
(4,43),
(6,2),
(6,4),
(6,8),
(6,12),
(6,18),
(6,19),
(6,23),
(6,27),
(6,33),
(6,35),
(6,39),
(6,43),
(7,1),
(7,2),
(7,3),
(7,4),
(7,5),
(7,6),
(7,7),
(7,8),
(7,9),
(7,10),
(7,11),
(7,12),
(7,13),
(7,14),
(7,15),
(7,16),
(7,17),
(7,18),
(7,19),
(7,20),
(7,21),
(7,22),
(7,23),
(7,24),
(7,25),
(7,26),
(7,27),
(7,28),
(7,29),
(7,30),
(7,31),
(7,32),
(7,33),
(7,34),
(7,35),
(7,36),
(7,37),
(7,38),
(7,39),
(7,40),
(7,41),
(7,42),
(7,43),
(7,44),
(7,45),
(7,46);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `isSystemAdmin` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_648e3f5447f725579d7d4ffdfb` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
(1,'Admin',1,1,'2026-03-31 16:28:21.000000',1,'2026-04-16 02:13:38.789307',NULL,1),
(2,'Kullanıcı',0,1,'2026-03-31 16:28:21.000000',1,'2026-04-17 22:58:31.000000',NULL,1);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `sale_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `quantity` decimal(15,4) NOT NULL,
  `shipped_quantity` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `price` decimal(15,2) NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `net_price` decimal(15,2) NOT NULL,
  `kdv_rate` decimal(5,2) NOT NULL DEFAULT 20.00,
  `kdv_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`sale_id`,`item_id`),
  KEY `FK_0e18dd713dec5c3bca8e8c2972c` (`item_id`),
  CONSTRAINT `FK_0e18dd713dec5c3bca8e8c2972c` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_c210a330b80232c29c2ad68462a` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES
(1,23,1.0000,0.0000,10500.00,0.00,0.00,10500.00,0.00,0.00,10500.00,NULL,11,'2026-04-22 10:03:20',NULL,'2026-04-22 10:03:20',NULL),
(1,26,1.0000,0.0000,13500.00,0.00,0.00,13500.00,0.00,0.00,13500.00,NULL,11,'2026-04-22 10:03:20',NULL,'2026-04-22 10:03:20',NULL);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sale_sequences`
--

DROP TABLE IF EXISTS `sale_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_sequences` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `department_id` bigint(20) NOT NULL,
  `current_number` int(11) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `state` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_sale_sequences_dept` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_sequences`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sale_sequences` WRITE;
/*!40000 ALTER TABLE `sale_sequences` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_sequences` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sale_types`
--

DROP TABLE IF EXISTS `sale_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_types` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `abbreviation` varchar(20) NOT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sale_types` WRITE;
/*!40000 ALTER TABLE `sale_types` DISABLE KEYS */;
INSERT INTO `sale_types` VALUES
(1,'Toptan Satış','TPT',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1),
(2,'Perakende Satış','PRK',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1),
(3,'İhracat','IHR',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1),
(4,'Satış Faturası','SAT',NULL,'2026-04-08 22:11:26.687761',NULL,'2026-04-08 22:11:26.687761',NULL,1),
(5,'İade Faturası','IAD',NULL,'2026-04-08 22:11:26.687761',NULL,'2026-04-08 22:11:26.687761',NULL,1),
(6,'Proforma Fatura','PRF',NULL,'2026-04-08 22:11:26.687761',NULL,'2026-04-08 22:11:26.687761',NULL,1);
/*!40000 ALTER TABLE `sale_types` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `party_id` bigint(20) NOT NULL,
  `sale_type_id` bigint(20) NOT NULL,
  `department_id` bigint(20) DEFAULT NULL,
  `staff_id` bigint(20) DEFAULT NULL,
  `currency_id` bigint(20) DEFAULT NULL,
  `exchange_rate` decimal(15,6) NOT NULL DEFAULT 1.000000,
  `delivery_date` date DEFAULT NULL,
  `status` enum('draft','approved','shipped','invoiced','cancelled') NOT NULL DEFAULT 'draft',
  `deposit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `kdv` decimal(15,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `profit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_tax_id` varchar(20) DEFAULT NULL,
  `lead_source` varchar(100) DEFAULT NULL,
  `address_city` varchar(100) DEFAULT NULL,
  `address_district` varchar(100) DEFAULT NULL,
  `address_detail` text DEFAULT NULL,
  `commercial_account_id` bigint(20) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_52107c4d0241a1ecf7b02d2c9e` (`code`),
  KEY `FK_734025a88e874a717f2cef4b01d` (`sale_type_id`),
  KEY `IDX_a2a41060831562f929920652dd` (`party_id`),
  KEY `IDX_70a5f9aed63b1ac6a6e8f722f5` (`department_id`),
  KEY `IDX_83e1f4b8d3b863cce4846e0295` (`status`),
  KEY `FK_90aa30b8ef87bd8b1cd05185422` (`currency_id`),
  KEY `FK_sales_commercial_account` (`commercial_account_id`),
  KEY `IDX_sales_staff` (`staff_id`),
  CONSTRAINT `FK_734025a88e874a717f2cef4b01d` FOREIGN KEY (`sale_type_id`) REFERENCES `sale_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_90aa30b8ef87bd8b1cd05185422` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_a2a41060831562f929920652ddd` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_sales_commercial_account` FOREIGN KEY (`commercial_account_id`) REFERENCES `commercial_accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_sales_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=12002 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_35690f287c60414f4b63614a00` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES
(1,'default_currency','TRY','Varsayılan sistem para birimi','2026-04-14 20:55:56.423721','2026-04-14 20:55:56.486962'),
(2,'authorized_phone','+90 555 555 55 55','Yetkili destek telefon numarası','2026-04-14 20:55:56.423721','2026-04-14 20:55:56.486962'),
(3,'company_name','ERMAY TEST','Şirket adı','2026-04-14 20:55:56.423721','2026-04-14 20:55:56.486962'),
(4,'tax_office','','Vergi dairesi','2026-04-14 20:55:56.423721','2026-04-14 20:55:56.486962'),
(5,'tax_number','','Vergi numarası','2026-04-14 20:55:56.423721','2026-04-14 20:55:56.486962'),
(6,'company_address','','Şirket adresi','2026-04-14 20:55:56.423721','2026-04-14 20:55:56.486962'),
(7,'invoice_footer_note','','Fatura alt notu','2026-04-14 20:55:56.423721','2026-04-14 20:55:56.486962');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `state` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0: Pasif/Silinmiş, 1: Aktif',
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `entry_date` date DEFAULT NULL,
  `department_id` bigint(20) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `tckn` varchar(11) DEFAULT NULL,
  `last_deactivation_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_staff_department` (`department_id`),
  CONSTRAINT `FK_staff_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES
(1,1,1,'2026-04-20 17:39:04',1,'2026-04-22 13:51:09',NULL,'TEST','TEST','1111111111','2026-04-20',13,1,'',NULL),
(2,1,1,'2026-04-20 17:58:10',1,'2026-04-22 08:51:45',NULL,'ÖMERR','RESR','1444444444','2026-04-22',5,1,'11111111111',NULL),
(3,1,1,'2026-04-22 09:48:29',1,'2026-04-22 09:48:29',NULL,'SEZER','SAKARYA','+901111111111','2026-04-22',4,1,'22222222222',NULL),
(4,1,1,'2026-04-22 09:48:42',1,'2026-04-22 09:48:42',NULL,'MUHAMMET','SAKARYA','+902131232131','2026-04-22',4,1,'13123123131',NULL);
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `stock_id` bigint(20) NOT NULL,
  `quantity` decimal(15,4) NOT NULL,
  `quantity_before` decimal(15,4) NOT NULL,
  `quantity_after` decimal(15,4) NOT NULL,
  `type` enum('in','out') NOT NULL,
  `reference_type` enum('sale','purchase','production','adjustment','return','manual','revert','shipment','transfer') NOT NULL,
  `reference_id` bigint(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  `unit_cost` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `total_cost` decimal(15,4) NOT NULL DEFAULT 0.0000,
  PRIMARY KEY (`id`),
  KEY `IDX_fe1f8086b016f319c4f7f38960` (`stock_id`),
  KEY `IDX_0b806354370f965f222032ff08` (`reference_type`),
  KEY `IDX_47ff43584c23092389aa9d9396` (`reference_id`),
  CONSTRAINT `FK_fe1f8086b016f319c4f7f389602` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `stocks`
--

DROP TABLE IF EXISTS `stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocks` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) NOT NULL,
  `department_id` bigint(20) NOT NULL,
  `quantity` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `reserved_quantity` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_49e3e11ea3f09ae7eead8f6617` (`item_id`,`department_id`),
  KEY `IDX_8a6ed191e8bfabc70976352f4b` (`department_id`),
  CONSTRAINT `FK_8a6ed191e8bfabc70976352f4b8` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_e31694209cc16bed37eee2b0e3e` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `chk_stock_quantity_non_negative` CHECK (`quantity` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocks`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `stocks` WRITE;
/*!40000 ALTER TABLE `stocks` DISABLE KEYS */;
INSERT INTO `stocks` VALUES
(1,17,4,0.0000,0.0000,1,'2026-04-22 09:19:39.569909',NULL,'2026-04-22 09:19:39.569909',NULL,1),
(2,17,5,0.0000,0.0000,1,'2026-04-22 09:19:39.573082',NULL,'2026-04-22 09:19:39.573082',NULL,1),
(3,17,6,0.0000,0.0000,1,'2026-04-22 09:19:39.576172',NULL,'2026-04-22 09:19:39.576172',NULL,1),
(4,17,10,0.0000,0.0000,1,'2026-04-22 09:19:39.578106',NULL,'2026-04-22 09:19:39.578106',NULL,1),
(5,18,4,0.0000,0.0000,1,'2026-04-22 09:20:51.991661',NULL,'2026-04-22 09:20:51.991661',NULL,1),
(6,18,5,0.0000,0.0000,1,'2026-04-22 09:20:51.994222',NULL,'2026-04-22 09:20:51.994222',NULL,1),
(7,18,6,0.0000,0.0000,1,'2026-04-22 09:20:51.997673',NULL,'2026-04-22 09:20:51.997673',NULL,1),
(8,18,10,0.0000,0.0000,1,'2026-04-22 09:20:52.000817',NULL,'2026-04-22 09:20:52.000817',NULL,1),
(9,19,4,0.0000,0.0000,1,'2026-04-22 09:21:56.735810',NULL,'2026-04-22 09:21:56.735810',NULL,1),
(10,19,5,0.0000,0.0000,1,'2026-04-22 09:21:56.737724',NULL,'2026-04-22 09:21:56.737724',NULL,1),
(11,19,6,0.0000,0.0000,1,'2026-04-22 09:21:56.739671',NULL,'2026-04-22 09:21:56.739671',NULL,1),
(12,19,10,0.0000,0.0000,1,'2026-04-22 09:21:56.741909',NULL,'2026-04-22 09:21:56.741909',NULL,1),
(13,20,4,0.0000,0.0000,1,'2026-04-22 09:22:29.449186',NULL,'2026-04-22 09:22:29.449186',NULL,1),
(14,20,5,0.0000,0.0000,1,'2026-04-22 09:22:29.450682',NULL,'2026-04-22 09:22:29.450682',NULL,1),
(15,20,6,0.0000,0.0000,1,'2026-04-22 09:22:29.453005',NULL,'2026-04-22 09:22:29.453005',NULL,1),
(16,20,10,0.0000,0.0000,1,'2026-04-22 09:22:29.456390',NULL,'2026-04-22 09:22:29.456390',NULL,1),
(17,21,4,0.0000,0.0000,1,'2026-04-22 09:22:57.068224',NULL,'2026-04-22 09:22:57.068224',NULL,1),
(18,21,5,0.0000,0.0000,1,'2026-04-22 09:22:57.069779',NULL,'2026-04-22 09:22:57.069779',NULL,1),
(19,21,6,0.0000,0.0000,1,'2026-04-22 09:22:57.071410',NULL,'2026-04-22 09:22:57.071410',NULL,1),
(20,21,10,0.0000,0.0000,1,'2026-04-22 09:22:57.073208',NULL,'2026-04-22 09:22:57.073208',NULL,1),
(21,22,4,0.0000,0.0000,1,'2026-04-22 09:24:01.356011',NULL,'2026-04-22 09:24:01.356011',NULL,1),
(22,22,5,0.0000,0.0000,1,'2026-04-22 09:24:01.358206',NULL,'2026-04-22 09:24:01.358206',NULL,1),
(23,22,6,0.0000,0.0000,1,'2026-04-22 09:24:01.360993',NULL,'2026-04-22 09:24:01.360993',NULL,1),
(24,22,10,0.0000,0.0000,1,'2026-04-22 09:24:01.363652',NULL,'2026-04-22 09:24:01.363652',NULL,1),
(25,23,4,0.0000,0.0000,1,'2026-04-22 09:25:04.527995',NULL,'2026-04-22 09:25:04.527995',NULL,1),
(26,23,5,0.0000,0.0000,1,'2026-04-22 09:25:04.531145',NULL,'2026-04-22 09:25:04.531145',NULL,1),
(27,23,6,0.0000,1.0000,1,'2026-04-22 09:25:04.534286',1,'2026-04-22 10:58:50.000000',NULL,1),
(28,23,10,0.0000,0.0000,1,'2026-04-22 09:25:04.536274',NULL,'2026-04-22 09:25:04.536274',NULL,1),
(29,24,4,0.0000,0.0000,1,'2026-04-22 09:25:39.016714',NULL,'2026-04-22 09:25:39.016714',NULL,1),
(30,24,5,0.0000,0.0000,1,'2026-04-22 09:25:39.019817',NULL,'2026-04-22 09:25:39.019817',NULL,1),
(31,24,6,0.0000,0.0000,1,'2026-04-22 09:25:39.022462',NULL,'2026-04-22 09:25:39.022462',NULL,1),
(32,24,10,0.0000,0.0000,1,'2026-04-22 09:25:39.026576',NULL,'2026-04-22 09:25:39.026576',NULL,1),
(33,25,4,0.0000,0.0000,1,'2026-04-22 09:26:23.489273',NULL,'2026-04-22 09:26:23.489273',NULL,1),
(34,25,5,0.0000,0.0000,1,'2026-04-22 09:26:23.490685',NULL,'2026-04-22 09:26:23.490685',NULL,1),
(35,25,6,0.0000,0.0000,1,'2026-04-22 09:26:23.492814',NULL,'2026-04-22 09:26:23.492814',NULL,1),
(36,25,10,0.0000,0.0000,1,'2026-04-22 09:26:23.494453',NULL,'2026-04-22 09:26:23.494453',NULL,1),
(37,26,4,0.0000,0.0000,1,'2026-04-22 09:28:27.352708',NULL,'2026-04-22 09:28:27.352708',NULL,1),
(38,26,5,0.0000,0.0000,1,'2026-04-22 09:28:27.354244',NULL,'2026-04-22 09:28:27.354244',NULL,1),
(39,26,6,0.0000,1.0000,1,'2026-04-22 09:28:27.357073',1,'2026-04-22 10:58:50.000000',NULL,1),
(40,26,10,0.0000,0.0000,1,'2026-04-22 09:28:27.359639',NULL,'2026-04-22 09:28:27.359639',NULL,1);
/*!40000 ALTER TABLE `stocks` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `system_logs`
--

DROP TABLE IF EXISTS `system_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `full_name` varchar(200) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `module` varchar(100) DEFAULT NULL,
  `tag` varchar(50) NOT NULL DEFAULT 'INFO',
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `IDX_a572427d16b851f8d9f1e8e7a3` (`user_id`),
  KEY `IDX_ede98826683a789116b7908835` (`module`),
  KEY `IDX_d37bc7914ccec9af8bca7d9f09` (`tag`),
  KEY `IDX_9a4a24c8ff8bf34d20d97cf448` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=627 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `system_logs` WRITE;
/*!40000 ALTER TABLE `system_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `transaction_sequences`
--

DROP TABLE IF EXISTS `transaction_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_sequences` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `prefix` varchar(10) NOT NULL,
  `current_number` int(11) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_67f6aa06c982b46929bad78298` (`prefix`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_sequences`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `transaction_sequences` WRITE;
/*!40000 ALTER TABLE `transaction_sequences` DISABLE KEYS */;
INSERT INTO `transaction_sequences` VALUES
(1,'MKB',2,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1),
(2,'TDY',3,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1),
(3,'FVR',1,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1);
/*!40000 ALTER TABLE `transaction_sequences` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `party_id` bigint(20) DEFAULT NULL,
  `commercial_account_id` bigint(20) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency_id` bigint(20) DEFAULT NULL,
  `exchange_rate` decimal(15,6) NOT NULL DEFAULT 1.000000,
  `type` enum('in','out') NOT NULL,
  `reference_type` enum('sale','purchase','manual_adjustment','manual') DEFAULT NULL,
  `reference_id` bigint(20) DEFAULT NULL,
  `date` date NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','completed','bounced_check','cancelled') NOT NULL DEFAULT 'pending',
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_7f1b559bc56646d367158479b1` (`code`),
  KEY `FK_9b7e25a06ce7744d8688691f64a` (`party_id`),
  KEY `FK_b85c978f6e3205d58eb5726db23` (`commercial_account_id`),
  KEY `FK_b515faccedf1dc36ac4f78acc04` (`currency_id`),
  CONSTRAINT `FK_9b7e25a06ce7744d8688691f64a` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_b515faccedf1dc36ac4f78acc04` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_b85c978f6e3205d58eb5726db23` FOREIGN KEY (`commercial_account_id`) REFERENCES `commercial_accounts` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `user_notes`
--

DROP TABLE IF EXISTS `user_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `content` text NOT NULL,
  `color` varchar(20) NOT NULL DEFAULT '#ffffff',
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_d2a9cb672e3701a1f2692c034a` (`user_id`),
  KEY `IDX_a0d5024b5ad64e65bdd9cc4acd` (`is_pinned`),
  CONSTRAINT `FK_d2a9cb672e3701a1f2692c034a4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_notes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user_notes` WRITE;
/*!40000 ALTER TABLE `user_notes` DISABLE KEYS */;
INSERT INTO `user_notes` VALUES
(1,1,'AA','aaa','#bbf7d0',1,0,'2026-04-08 02:47:58.000000','2026-04-21 19:51:44.000000'),
(2,1,'A','a','#e9d5ff',0,0,'2026-04-08 22:40:08.000000','2026-04-21 19:51:47.000000'),
(3,1,'A','a','#e9d5ff',0,0,'2026-04-13 21:55:55.000000','2026-04-21 19:51:45.000000');
/*!40000 ALTER TABLE `user_notes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissions` (
  `user_id` bigint(20) NOT NULL,
  `permission_id` bigint(20) NOT NULL,
  `effect` enum('allow','deny') NOT NULL,
  `scope_type` enum('global','department','own') NOT NULL DEFAULT 'global',
  `scope_id` bigint(20) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`,`permission_id`,`scope_type`),
  KEY `FK_8145f5fadacd311693c15e41f10` (`permission_id`),
  CONSTRAINT `FK_3495bd31f1862d02931e8e8d2e8` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_8145f5fadacd311693c15e41f10` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
INSERT INTO `user_permissions` VALUES
(1,1,'allow','global',NULL,1,'2026-04-08 02:19:03',NULL,'2026-04-08 02:19:03',NULL),
(1,2,'allow','global',NULL,1,'2026-04-08 00:42:16',1,'2026-04-08 00:42:16',NULL),
(1,3,'allow','global',NULL,1,'2026-04-08 00:42:18',1,'2026-04-08 00:42:18',NULL),
(2,2,'allow','global',NULL,1,'2026-04-08 00:41:38',1,'2026-04-08 00:41:38',NULL),
(2,2,'allow','department',2,1,'2026-04-08 00:41:40',1,'2026-04-08 00:41:40',NULL),
(2,3,'allow','global',NULL,1,'2026-04-08 00:41:51',1,'2026-04-08 00:41:51',NULL),
(4,19,'allow','global',NULL,1,'2026-04-08 22:42:44',NULL,'2026-04-08 22:42:44',NULL),
(4,20,'allow','global',NULL,1,'2026-04-08 22:42:45',NULL,'2026-04-08 22:42:45',NULL),
(4,21,'allow','global',NULL,1,'2026-04-08 22:42:44',NULL,'2026-04-08 22:42:44',NULL),
(6,21,'allow','global',NULL,1,'2026-04-13 19:07:24',1,'2026-04-13 19:07:24',NULL);
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint(20) NOT NULL,
  `role_id` bigint(20) NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `IDX_87b8888186ca9769c960e92687` (`user_id`),
  KEY `IDX_b23c65e50a758245a33ee35fda` (`role_id`),
  CONSTRAINT `FK_87b8888186ca9769c960e926870` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_b23c65e50a758245a33ee35fda1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES
(1,1),
(6,2),
(11,2);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `refresh_token_hash` varchar(255) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department_id` bigint(20) DEFAULT NULL,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `token_version` int(11) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  `locked_until` timestamp NULL DEFAULT NULL,
  `entry_date` date DEFAULT NULL,
  `last_deactivation_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `UQ_EMAIL_ACTIVE` (`email`),
  KEY `UQ_USERNAME_ACTIVE` (`username`),
  KEY `FK_0921d1972cf861d568f5271cd85` (`department_id`),
  CONSTRAINT `FK_0921d1972cf861d568f5271cd85` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'testadmin','$2b$12$.JTpsIEzqb182ZviAq2jQ.y/DaOP.iVHLMd.UqjpJg0X.ziBnRLfa',NULL,'Test Admin','admin@test.com','+90 555 555 55 55',5,0,1,1,'2026-03-30 17:58:43.000000',1,'2026-04-22 10:42:19.000000',NULL,1,NULL,NULL,NULL),
(3,'test','$2b$12$nr04BJNn0dzfvLU9eQ5pmeaNBgF70vuYaPYZiU0v29Uwe82sTiLfa',NULL,'test','test@gamil.com','05511345360',2,0,1,1,'2026-04-04 12:13:13.000000',1,'2026-04-04 12:14:08.000000','2026-04-04 12:14:08.000000',1,NULL,NULL,NULL),
(6,'izmitmagaza','$2b$12$eiHv/U.JkSucafGuxzWt3e6CP2DXtad1gU.AxGfoPjMaPdAN5WVAu',NULL,'BAYRAM-KARACA','w@outlook.com','+90 532 419 41 51',10,1,1,1,'2026-04-11 18:31:41.038615',1,'2026-04-22 09:12:01.000000',NULL,1,NULL,NULL,NULL),
(11,'adaofi̇s','$2b$12$z3p8aUlSs6s1qhdjAY4spOilN8m/mFMQtVEfYIvbBGhXR9LG5z6li',NULL,'SEZER SAKARYA','w@hotmail.com','+90 533 559 40 54',4,0,1,1,'2026-04-22 09:07:02.146889',NULL,'2026-04-22 09:12:17.000000',NULL,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Dumping routines for database 'benyaptim'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-04-28  6:33:50
