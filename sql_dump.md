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
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`bom_id`,`item_id`),
  KEY `fk_bi_created_by` (`created_by`),
  KEY `fk_bi_updated_by` (`updated_by`),
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
(1,1,13.0000,'aaa',1,'2026-04-01 17:53:24',NULL,'2026-04-01 17:53:24',NULL),
(1,2,41.0000,'a',1,'2026-04-01 17:53:24',NULL,'2026-04-01 17:53:24',NULL),
(2,3,1.0000,NULL,1,'2026-04-01 19:36:15',NULL,'2026-04-01 19:36:15',NULL),
(2,4,1.0000,NULL,1,'2026-04-01 19:36:15',NULL,'2026-04-01 19:36:15',NULL),
(2,5,5.0000,NULL,1,'2026-04-01 19:36:15',NULL,'2026-04-01 19:36:15',NULL),
(3,5,1.0000,'',1,'2026-04-08 02:09:12',NULL,'2026-04-08 02:09:12',NULL),
(4,5,1.0000,'',1,'2026-04-08 02:47:00',NULL,'2026-04-08 02:47:00',NULL),
(5,5,1.0000,'',1,'2026-04-08 02:47:07',NULL,'2026-04-08 02:47:07',NULL),
(6,13,2.0000,'',1,'2026-04-11 16:45:16',NULL,'2026-04-11 16:45:16',NULL),
(7,5,1.0000,'',1,'2026-04-13 18:46:02',NULL,'2026-04-13 18:46:02',NULL),
(7,13,4.0000,'',1,'2026-04-13 18:46:02',NULL,'2026-04-13 18:46:02',NULL),
(8,13,1.0000,'',1,'2026-04-13 22:00:50',NULL,'2026-04-13 22:00:50',NULL);
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
  KEY `fk_boms_created_by` (`created_by`),
  KEY `fk_boms_updated_by` (`updated_by`),
  KEY `fk_boms_target_item` (`target_item_id`),
  CONSTRAINT `fk_boms_target_item` FOREIGN KEY (`target_item_id`) REFERENCES `items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boms`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boms` WRITE;
/*!40000 ALTER TABLE `boms` DISABLE KEYS */;
INSERT INTO `boms` VALUES
(1,'menemen',NULL,1,1,'mennnnememen',1,'2026-04-01 17:53:24.000000',1,'2026-04-13 21:59:35.000000',NULL,1),
(2,'ÜÇGEN MÜDÜR',NULL,1,1,'ÜÇGEN DESEN MÜDÜR KOLTUĞU',1,'2026-04-01 19:36:15.000000',NULL,'2026-04-01 19:36:15.000000',NULL,1),
(3,'Ü.BALİ',4,1,1,NULL,1,'2026-04-08 02:09:12.486486',NULL,'2026-04-08 02:09:12.486486',NULL,1),
(4,'TEST',NULL,1,1,'TESTES',1,'2026-04-08 02:47:00.162911',1,'2026-04-08 02:47:23.000000',NULL,0),
(5,'TEST',NULL,1,1,'TESTES',1,'2026-04-08 02:47:07.045016',NULL,'2026-04-08 02:47:07.045016',NULL,1),
(6,'AAA',NULL,1,1,'AAA',1,'2026-04-11 16:45:16.302700',1,'2026-04-13 21:59:48.000000',NULL,1),
(7,'TEST (KOPYA)',NULL,1,1,'TESTES',1,'2026-04-13 18:46:02.656240',1,'2026-04-13 19:26:49.000000',NULL,0),
(8,'ZZZZZZ',NULL,1,1,NULL,1,'2026-04-13 22:00:50.335278',NULL,'2026-04-13 22:00:50.335278',NULL,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commercial_accounts`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `commercial_accounts` WRITE;
/*!40000 ALTER TABLE `commercial_accounts` DISABLE KEYS */;
INSERT INTO `commercial_accounts` VALUES
(1,'İZMİT KASA','KUVEYT TÜRK','9400 0620 0022 4000 0689 0535','MEHMET ERBAY',1,0.00,'bayram karaca',1,'2026-04-01 18:41:47.000000',NULL,'2026-04-01 18:41:47.000000',NULL,1),
(2,'SAKARYA KASA','KUVEYTTÜRK','TR12 3123 1231 2321 3123 1231 23','BEDIRHAN INAL',1,100000.00,'SAKARYA KASA SORUMLU SEZER',1,'2026-04-07 18:42:01.018434',NULL,'2026-04-07 18:42:01.018434',NULL,1),
(3,'ÇORLU KASA','QNB FINANS','TR11 1111 1111 1111 1111 1111 11','MEHMET ERBAY QNB',1,50000.00,'ÖMER ÇORLU KASA',1,'2026-04-07 18:44:48.555329',NULL,'2026-04-07 18:44:48.555329',NULL,1),
(4,'IST DEPO KASA(ISM)','NAKIT','TR22 2222 2222 2222 2222 2222 22','ISMAIL ŞAHIN',1,30000.00,'ISMAIL ŞAHIN SORUMLU',1,'2026-04-07 18:46:55.283074',NULL,'2026-04-07 18:46:55.283074',NULL,1),
(5,'ANA KASA ( MUSTAFA)','QNB ENPARA','TR12 2314 1141 2412 4124 1241 41','MEHMET ERBAY',1,1000000.00,'MUSTAFA ERBAY ANA KASA',1,'2026-04-11 18:44:44.297738',NULL,'2026-04-11 18:44:44.297738',NULL,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currencies`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
INSERT INTO `currencies` VALUES
(1,'TRY','Türk Lirası','₺',1.000000,1,NULL,'2026-03-30 15:36:21.000000',NULL,'2026-04-08 22:18:02.000000',NULL,1),
(2,'USD','Amerikan Doları','$',0.000000,0,NULL,'2026-03-30 15:36:21.000000',NULL,'2026-04-08 22:18:02.000000',NULL,1),
(3,'EUR','Euro','€',0.000000,0,NULL,'2026-03-30 15:36:21.000000',NULL,'2026-04-08 22:18:02.000000',NULL,1);
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`,`abbreviation`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(4,'İdari','IDR',NULL,'2026-04-04 12:30:38.000000',NULL,'2026-04-13 19:04:08.000000','2026-04-13 19:04:08.000000',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES
(1,'test','test','stest',NULL,NULL,1,'2026-04-01 12:40:54.000000',1,'2026-04-01 12:41:21.000000','2026-04-01 12:41:21.000000',1),
(2,'depo','depo hırrime','dep',NULL,NULL,1,'2026-04-01 17:50:37.000000',1,'2026-04-11 18:35:53.000000',NULL,0),
(3,'izmit depoKKKW','İZMİT DEPO - ( MOPAŞ )QQQW','DİZMQQQW',NULL,NULL,1,'2026-04-01 18:24:39.000000',1,'2026-04-04 11:56:15.000000','2026-04-04 11:56:15.000000',1),
(4,'SAKARYA MAĞAZA','SEZER SAKARYA','MADA',2,2,1,'2026-04-07 18:43:09.300894',NULL,'2026-04-07 18:43:09.300894',NULL,1),
(5,'ÇORLU MAĞAZA','ÖMER SORUMLU','MCOR',2,3,1,'2026-04-07 18:45:12.731921',NULL,'2026-04-07 18:45:12.731921',NULL,1),
(6,'MERKEZ DEPO(IST)','ISMAIL ŞAHIN','DIST',2,4,1,'2026-04-07 18:47:38.890289',1,'2026-04-11 18:36:10.000000',NULL,1),
(7,'TEST','TEST','TEST',1,3,1,'2026-04-08 02:15:24.916271',1,'2026-04-08 22:46:57.000000',NULL,0),
(8,'AAAA','AAA','AAAA',NULL,NULL,1,'2026-04-08 02:34:20.875171',1,'2026-04-11 18:35:22.000000',NULL,0),
(9,'AA','AAA','AAAA',2,4,1,'2026-04-08 22:41:31.636311',1,'2026-04-11 18:35:32.000000',NULL,0),
(10,'İZMİT MAĞAZA','BAYRAM KARACA','MERM',2,1,1,'2026-04-11 18:30:24.632395',1,'2026-04-13 21:56:39.000000',NULL,1);
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
  `state` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prefix` (`prefix`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_code_groups`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `item_code_groups` WRITE;
/*!40000 ALTER TABLE `item_code_groups` DISABLE KEYS */;
INSERT INTO `item_code_groups` VALUES
(1,'MOBİLYA','MOB',1,1,'2026-04-08 22:18:18',NULL,'2026-04-08 22:18:18',NULL);
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
  `current_number` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_code_group_id` (`item_code_group_id`),
  CONSTRAINT `fk_ics_group` FOREIGN KEY (`item_code_group_id`) REFERENCES `item_code_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_code_sequences`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `item_code_sequences` WRITE;
/*!40000 ALTER TABLE `item_code_sequences` DISABLE KEYS */;
INSERT INTO `item_code_sequences` VALUES
(1,1,5);
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `item_types` WRITE;
/*!40000 ALTER TABLE `item_types` DISABLE KEYS */;
INSERT INTO `item_types` VALUES
(1,'Hammadde','HMD',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1),
(2,'Yarı Mamül','YRM',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1),
(3,'Mamül','MML',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1),
(4,'Ticari Mal','TCM',1,'2026-03-31 16:28:21.000000',1,'2026-04-13 21:58:07.000000',NULL,1),
(5,'TESTSET','TES',1,'2026-04-08 02:45:05.176464',NULL,'2026-04-13 21:59:03.000000','2026-04-13 21:59:03.000000',1),
(6,'Hammadde','HMD',NULL,'2026-04-08 22:11:26.684004',NULL,'2026-04-08 22:11:26.684004',NULL,1),
(7,'Mamül','MAM',NULL,'2026-04-08 22:11:26.684004',NULL,'2026-04-13 21:58:15.000000','2026-04-13 21:58:15.000000',1),
(8,'Yarı Mamül','YRM',NULL,'2026-04-08 22:11:26.684004',NULL,'2026-04-08 22:11:26.684004',NULL,1),
(9,'Ticari Mal','TIC',NULL,'2026-04-08 22:11:26.684004',NULL,'2026-04-13 21:58:21.000000','2026-04-13 21:58:21.000000',1),
(10,'Sarf Malzeme','SRF',NULL,'2026-04-08 22:11:26.684004',NULL,'2026-04-13 21:58:31.000000','2026-04-13 21:58:31.000000',1),
(11,'Hammadde','HM',NULL,'2026-04-13 19:58:12.023604',NULL,'2026-04-13 21:58:57.000000','2026-04-13 21:58:57.000000',1),
(12,'Yarı Mamul','YM',NULL,'2026-04-13 19:58:12.023604',NULL,'2026-04-13 21:58:37.000000','2026-04-13 21:58:37.000000',1),
(13,'Mamul','MA',NULL,'2026-04-13 19:58:12.023604',NULL,'2026-04-13 21:58:51.000000','2026-04-13 21:58:51.000000',1),
(14,'Ticari Mal','TM',NULL,'2026-04-13 19:58:12.023604',NULL,'2026-04-13 21:58:46.000000','2026-04-13 21:58:46.000000',1),
(15,'Hizmet','HZ',NULL,'2026-04-13 19:58:12.023604',NULL,'2026-04-13 21:58:41.000000','2026-04-13 21:58:41.000000',1);
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
  `sale_price` decimal(15,2) DEFAULT NULL,
  `net_price` decimal(15,2) DEFAULT NULL,
  `currency_id` bigint(20) DEFAULT NULL,
  `quantity_type_id` bigint(20) NOT NULL,
  `kdv` decimal(5,2) NOT NULL DEFAULT 20.00,
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
  UNIQUE KEY `IDX_1b0a705ce0dc5430c020a0ec31` (`code`),
  KEY `fk_items_created_by` (`created_by`),
  KEY `fk_items_updated_by` (`updated_by`),
  KEY `FK_93f02a9196a53d0f4b2412aa42c` (`item_type_id`),
  KEY `FK_de7d03999d028482299f18feca8` (`provider_id`),
  KEY `FK_233b596fc5b2424beb1f2f82ba8` (`currency_id`),
  KEY `FK_b57597a0f63c67d287482179bd3` (`quantity_type_id`),
  KEY `idx_item_code_group` (`item_code_group_id`),
  CONSTRAINT `FK_233b596fc5b2424beb1f2f82ba8` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_93f02a9196a53d0f4b2412aa42c` FOREIGN KEY (`item_type_id`) REFERENCES `item_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_b57597a0f63c67d287482179bd3` FOREIGN KEY (`quantity_type_id`) REFERENCES `quantity_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_de7d03999d028482299f18feca8` FOREIGN KEY (`provider_id`) REFERENCES `parties` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_item_cg` FOREIGN KEY (`item_code_group_id`) REFERENCES `item_code_groups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES
(1,'yumurta',1,'HMD-001',NULL,0.0000,NULL,31.00,NULL,NULL,1,7,20.00,NULL,NULL,1,'2026-04-01 17:52:36.000000',1,'2026-04-07 00:06:32.000000',NULL,1,NULL,NULL,NULL),
(2,'kavanoz',1,'HMD-002',NULL,0.0000,NULL,41.00,NULL,NULL,3,2,20.00,NULL,NULL,1,'2026-04-01 17:52:54.000000',NULL,'2026-04-01 19:16:11.000000','2026-04-01 19:16:11.000000',1,NULL,NULL,NULL),
(3,'Ü. TAHTA',1,'HMD-003',1,0.0000,NULL,5.00,10.00,NULL,1,1,20.00,'B',NULL,1,'2026-04-01 19:16:40.000000',NULL,'2026-04-01 19:16:40.000000',NULL,1,NULL,NULL,NULL),
(4,'Ü. BALİ',1,'HMD-004',1,0.0000,NULL,5.00,110.00,NULL,1,2,20.00,'b',NULL,1,'2026-04-01 19:19:57.000000',1,'2026-04-07 04:16:57.000000',NULL,1,NULL,NULL,NULL),
(5,'Ü. VİDAa',1,'HMD-005',1,50.0000,NULL,10000.00,17000.00,0.00,1,1,10.00,'DENEME','İÇ DENEME',1,'2026-04-01 19:20:33.000000',1,'2026-04-07 19:01:32.000000',NULL,1,NULL,NULL,NULL),
(6,'TEST',2,'MOB-001',NULL,0.0000,'',5.00,5.00,NULL,3,2,20.00,'','',1,'2026-04-08 22:31:50.235503',NULL,'2026-04-08 22:31:50.235503',NULL,1,NULL,NULL,1),
(11,'A',3,'MOB-002',NULL,0.0000,'',5.00,5.00,NULL,1,1,20.00,'','',1,'2026-04-08 22:34:19.971070',NULL,'2026-04-08 22:34:19.971070',NULL,1,NULL,NULL,1),
(12,'A',1,'MOB-003',NULL,0.0000,'',5.00,5.00,NULL,1,1,20.00,'','',1,'2026-04-08 22:34:38.070609',NULL,'2026-04-08 22:34:38.070609',NULL,1,NULL,NULL,1),
(13,'TESTEEEEEEEEEE',3,'MOB-004',NULL,555.0000,'',111111.00,111111.00,NULL,1,3,55.00,'','',1,'2026-04-11 16:07:42.160517',NULL,'2026-04-11 16:07:42.160517',NULL,1,NULL,NULL,1);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
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
  KEY `fk_parties_created_by` (`created_by`),
  KEY `fk_parties_updated_by` (`updated_by`),
  KEY `FK_ec10d8b82ab62f336df1c32a061` (`currency_id`),
  CONSTRAINT `FK_ec10d8b82ab62f336df1c32a061` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parties`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `parties` WRITE;
/*!40000 ALTER TABLE `parties` DISABLE KEYS */;
INSERT INTO `parties` VALUES
(1,'both','YUSUF DEMİR1234','0541','',NULL,'12345678910','bedo@bedo.bedo','umutteoe',NULL,NULL,-49976.00,10000.00,'',1,'',1,'2026-04-01 19:06:53.000000',1,'2026-04-07 19:20:58.000000',NULL,1),
(2,'provider','AHMET DEMİR','0 (541) 561 25 10','0 (541) 561 25 10',NULL,'1234567891','bedo@bedo.com','KOCAELİ / İZMİT / YEŞİLOVA',NULL,NULL,0.00,50000.00,'',1,'',1,'2026-04-07 19:11:31.245894',1,'2026-04-07 19:21:05.000000',NULL,1),
(3,'customer','VELINIMET BAHTIYAR','0 (231) 231 23 12','',NULL,'64666464646','qwe@qwe.com','IST / MALTEĞE',NULL,NULL,0.00,25000.00,'',1,'',1,'2026-04-07 19:58:54.493945',NULL,'2026-04-07 19:58:54.493945',NULL,1);
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
  PRIMARY KEY (`id`),
  KEY `fk_pg_created_by` (`created_by`),
  KEY `fk_pg_updated_by` (`updated_by`)
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_017943867ed5ceef9c03edd974` (`key`),
  KEY `fk_perm_created_by` (`created_by`),
  KEY `fk_perm_updated_by` (`updated_by`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES
(1,'sys.all','Tam Yetki','Sistem',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1),
(2,'sales.view','Satış Görüntüleme','Satış',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1),
(3,'sales.create','Satış Oluşturma','Satış',1,'2026-03-31 16:28:21.000000',NULL,'2026-03-31 16:28:21.000000',NULL,1),
(4,'stok_goruntuleme','Stok Görüntüle','inventory',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(5,'stok_olusturma','Stok Oluştur','inventory',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(6,'stok_duzenleme','Stok Düzenle','inventory',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(7,'stok_silme','Stok Sil','inventory',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(8,'kullanici_goruntuleme','Kullanıcı Görüntüle','users',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(9,'kullanici_olusturma','Kullanıcı Oluştur','users',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(10,'kullanici_duzenleme','Kullanıcı Düzenle','users',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(11,'kullanici_silme','Kullanıcı Sil','users',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(12,'rol_goruntuleme','Rol Görüntüle','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(13,'rol_olusturma','Rol Oluştur','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(14,'rol_duzenleme','Rol Düzenle','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(15,'rol_silme','Rol Sil','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(16,'rol_atama','Rol Ata/Kaldır','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(17,'yetki_atama','Yetki Ata','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(18,'yetki_goruntuleme','Yetkileri Görüntüle','roles',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(19,'departman_goruntuleme','Departman Görüntüle','departments',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(20,'departman_olusturma','Departman Oluştur','departments',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(21,'departman_duzenleme','Departman Düzenle','departments',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(22,'departman_silme','Departman Sil','departments',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(23,'musteri_goruntuleme','Cari Görüntüle','parties',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(24,'musteri_olusturma','Cari Oluştur','parties',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(25,'musteri_duzenleme','Cari Düzenle','parties',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(26,'musteri_silme','Cari Sil','parties',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(27,'satis_goruntuleme','Satış Görüntüle','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(28,'satis_olusturma','Satış Oluştur','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(29,'satis_duzenleme','Satış Düzenle','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(30,'satis_onaylama','Satış Onayla','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(31,'satis_iptal','Satış İptal','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(32,'satis_silme','Satış Sil','sales',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(33,'finans_goruntuleme','Finans Görüntüle','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(34,'finans_islem','Finans İşlem','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(35,'finans_hesap_goruntuleme','Hesap Görüntüle','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(36,'finans_hesap_olusturma','Hesap Oluştur','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(37,'finans_hesap_duzenleme','Hesap Düzenle','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(38,'finans_hesap_silme','Hesap Sil','finance',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(39,'uretim_goruntuleme','Üretim Görüntüle','production',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(40,'uretim_olusturma','Üretim Oluştur','production',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(41,'uretim_duzenleme','Üretim Düzenle','production',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(42,'uretim_silme','Üretim Sil','production',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(43,'ayar_goruntuleme','Ayar Görüntüle','system',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(44,'ayar_duzenleme','Ayar Düzenle','system',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1),
(45,'sistem_yonetimi','Sistem Yönetimi','system',NULL,'2026-04-08 22:11:26.694271',NULL,'2026-04-08 22:11:26.694271',NULL,1);
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
  KEY `fk_po_created_by` (`created_by`),
  KEY `fk_po_updated_by` (`updated_by`),
  KEY `FK_22d2520dd41c0d6a58b511af20a` (`bom_id`),
  KEY `fk_po_source_dept` (`source_department_id`),
  KEY `fk_po_target_dept` (`target_department_id`),
  CONSTRAINT `FK_22d2520dd41c0d6a58b511af20a` FOREIGN KEY (`bom_id`) REFERENCES `boms` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_po_source_dept` FOREIGN KEY (`source_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_po_target_dept` FOREIGN KEY (`target_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_orders`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `production_orders` WRITE;
/*!40000 ALTER TABLE `production_orders` DISABLE KEYS */;
INSERT INTO `production_orders` VALUES
(1,'URT-001',2,NULL,NULL,5.0000,0.0000,0.0000,'draft',0.0000,0.0000,'2026-04-01','2026-04-01','3 GÜNDE',1,'2026-04-01 19:39:39.000000',NULL,'2026-04-01 19:39:39.000000',NULL,1);
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_sequences`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `production_sequences` WRITE;
/*!40000 ALTER TABLE `production_sequences` DISABLE KEYS */;
INSERT INTO `production_sequences` VALUES
(1,'URT',2,1,'2026-03-31 16:28:21',NULL,'2026-04-01 19:39:39',NULL,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(8,'Adet','AD',NULL,'2026-04-08 22:11:26.678117',1,'2026-04-13 19:01:52.000000','2026-04-13 19:01:52.000000',0),
(9,'Kilogram','KG',NULL,'2026-04-08 22:11:26.678117',1,'2026-04-13 19:02:19.000000','2026-04-13 19:02:19.000000',1),
(10,'Metre','MT',NULL,'2026-04-08 22:11:26.678117',1,'2026-04-13 19:02:46.000000','2026-04-13 19:02:46.000000',1),
(11,'Litre','LT',NULL,'2026-04-08 22:11:26.678117',NULL,'2026-04-08 22:11:26.678117',NULL,1),
(12,'Paket','PK',NULL,'2026-04-08 22:11:26.678117',1,'2026-04-13 18:55:38.000000',NULL,1),
(13,'Kutu','KT',NULL,'2026-04-08 22:11:26.678117',NULL,'2026-04-11 17:20:49.000000','2026-04-11 17:20:49.000000',1),
(14,'TEST','test',1,'2026-04-11 17:21:09.905529',1,'2026-04-13 18:49:02.000000','2026-04-13 18:49:02.000000',0);
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
(3,33),
(3,34),
(3,37);
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
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_648e3f5447f725579d7d4ffdfb` (`name`),
  KEY `fk_roles_created_by` (`created_by`),
  KEY `fk_roles_updated_by` (`updated_by`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
(1,'Admin',1,'2026-03-31 16:28:21.000000',1,'2026-04-08 00:42:59.000000',NULL,1),
(2,'Kullanıcı',1,'2026-03-31 16:28:21.000000',1,'2026-04-08 02:51:04.000000',NULL,1),
(3,'TEST',1,'2026-04-11 16:02:34.733453',1,'2026-04-11 16:11:05.000000',NULL,1);
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
  KEY `fk_si_created_by` (`created_by`),
  KEY `fk_si_updated_by` (`updated_by`),
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
(1,5,10.0000,2.00,0.00,0.00,2.00,20.00,4.00,24.00,NULL,1,'2026-04-07 04:05:42',NULL,'2026-04-07 04:05:42',NULL);
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
  `sale_type_id` bigint(20) NOT NULL,
  `current_number` int(11) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_776549526c66da429cc8bd9110` (`sale_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_sequences`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sale_sequences` WRITE;
/*!40000 ALTER TABLE `sale_sequences` DISABLE KEYS */;
INSERT INTO `sale_sequences` VALUES
(1,1,2,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1),
(2,2,1,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1),
(3,3,1,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1);
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
  `currency_id` bigint(20) DEFAULT NULL,
  `exchange_rate` decimal(15,6) NOT NULL DEFAULT 1.000000,
  `delivery_date` date DEFAULT NULL,
  `status` enum('draft','approved','shipped','invoiced','cancelled') NOT NULL DEFAULT 'draft',
  `deposit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `kdv` decimal(5,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_52107c4d0241a1ecf7b02d2c9e` (`code`),
  KEY `fk_sales_created_by` (`created_by`),
  KEY `fk_sales_updated_by` (`updated_by`),
  KEY `FK_a2a41060831562f929920652ddd` (`party_id`),
  KEY `FK_734025a88e874a717f2cef4b01d` (`sale_type_id`),
  KEY `FK_90aa30b8ef87bd8b1cd05185422` (`currency_id`),
  CONSTRAINT `FK_734025a88e874a717f2cef4b01d` FOREIGN KEY (`sale_type_id`) REFERENCES `sale_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_90aa30b8ef87bd8b1cd05185422` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_a2a41060831562f929920652ddd` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES
(1,'TPT-001',1,1,1,1.000000,'2026-04-07','approved',0.00,20.00,0.00,0.00,4.00,24.00,'TEMSILCI: BILINMIYOR\nFATURA DURUMU: FATURASIZ\nEK NOT: ',1,'2026-04-07 04:05:42.310113',1,'2026-04-07 04:05:49.000000',NULL,1);
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
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES
(1,'default_currency','TRY','Varsayılan sistem para birimi','2026-04-07 23:57:18','2026-04-07 23:57:18'),
(2,'authorized_phone','+90 555 555 55 55','Yetkili destek telefon numarası','2026-04-07 23:57:18','2026-04-07 23:57:18'),
(3,'company_name','ERMAY TEST','Şirket adı','2026-04-07 23:57:18','2026-04-08 00:15:00'),
(4,'tax_office','','Vergi dairesi','2026-04-07 23:57:18','2026-04-07 23:57:18'),
(5,'tax_number','','Vergi numarası','2026-04-07 23:57:18','2026-04-07 23:57:18'),
(6,'company_address','','Şirket adresi','2026-04-07 23:57:18','2026-04-07 23:57:18'),
(7,'invoice_footer_note','','Fatura alt notu','2026-04-07 23:57:18','2026-04-07 23:57:18');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
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
  `reference_type` enum('sale','purchase','production','adjustment','return','manual') NOT NULL,
  `reference_id` bigint(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fk_sm_created_by` (`created_by`),
  KEY `fk_sm_updated_by` (`updated_by`),
  KEY `FK_fe1f8086b016f319c4f7f389602` (`stock_id`),
  CONSTRAINT `FK_fe1f8086b016f319c4f7f389602` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES
(1,1,50.0000,0.0000,50.0000,'in','manual',NULL,'TEST',NULL,1,'2026-04-07 04:00:03.259547',NULL,'2026-04-07 04:00:03.259547',NULL,1),
(2,1,10.0000,50.0000,40.0000,'out','sale',1,'Satış onayı: TPT-001',NULL,1,'2026-04-07 04:05:49.481408',NULL,'2026-04-07 04:05:49.481408',NULL,1);
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
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_49e3e11ea3f09ae7eead8f6617` (`item_id`,`department_id`),
  KEY `fk_stocks_created_by` (`created_by`),
  KEY `fk_stocks_updated_by` (`updated_by`),
  KEY `FK_8a6ed191e8bfabc70976352f4b8` (`department_id`),
  CONSTRAINT `FK_8a6ed191e8bfabc70976352f4b8` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_e31694209cc16bed37eee2b0e3e` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `chk_stock_quantity_non_negative` CHECK (`quantity` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocks`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `stocks` WRITE;
/*!40000 ALTER TABLE `stocks` DISABLE KEYS */;
INSERT INTO `stocks` VALUES
(1,5,2,40.0000,1,'2026-04-07 04:00:03.254733',1,'2026-04-07 04:05:49.000000',NULL,1);
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
  `module` varchar(100) DEFAULT NULL COMMENT 'sales, items, users, auth vb.',
  `tag` varchar(50) DEFAULT 'INFO' COMMENT 'INFO, WARNING, ERROR, CRITICAL, SUCCESS',
  `details` text DEFAULT NULL COMMENT 'JSON detay bilgisi',
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_module` (`module`),
  KEY `idx_tag` (`tag`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `system_logs` WRITE;
/*!40000 ALTER TABLE `system_logs` DISABLE KEYS */;
INSERT INTO `system_logs` VALUES
(1,NULL,'GHOST',NULL,'POST /api/auth/login','AUTH','SUCCESS','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:44:33'),
(2,1,'testadmin',NULL,'PUT /api/currencies/2/default','CURRENCIES','ERROR','{\"body\":{},\"status\":\"ERROR\",\"response\":\"Empty criteria(s) are not allowed for the update method.\"}','::ffff:127.0.0.1','2026-04-08 02:44:50'),
(3,1,'testadmin',NULL,'POST /api/items/types','ITEMS','SUCCESS','{\"body\":{\"name\":\"TESTSET\",\"abbreviation\":\"TES\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:45:05'),
(4,1,'testadmin',NULL,'DELETE /api/currencies/4','CURRENCIES','SUCCESS','{\"body\":{},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:45:47'),
(5,1,'testadmin',NULL,'PUT /api/currencies/3/default','CURRENCIES','ERROR','{\"body\":{},\"status\":\"ERROR\",\"response\":\"Empty criteria(s) are not allowed for the update method.\"}','::ffff:127.0.0.1','2026-04-08 02:45:51'),
(6,1,'testadmin',NULL,'PUT /api/items/types/1','ITEMS','ERROR','{\"body\":{\"state\":0},\"status\":\"ERROR\",\"response\":\"Bu türde 4 adet aktif ürün bulunduğu için pasife alınamaz.\"}','::ffff:127.0.0.1','2026-04-08 02:46:05'),
(7,1,'testadmin',NULL,'PUT /api/items/types/4','ITEMS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:46:14'),
(8,1,'testadmin',NULL,'POST /api/production/boms','PRODUCTION','ERROR','{\"body\":{\"name\":\"TEST\",\"description\":\"TESTES\",\"items\":[{\"itemId\":\"5\",\"quantity\":1,\"description\":\"\"},{\"itemId\":\"5\",\"quantity\":1,\"description\":\"\"},{\"itemId\":\"5\",\"quantity\":1,\"description\":\"\"},{\"itemId\":\"5\",\"quantity\":1,\"description\":\"\"},{\"itemId\":\"5\",\"quantity\":1,\"description\":\"\"}]},\"status\":\"ERROR\",\"response\":\"Duplicate entry \'4-5\' for key \'PRIMARY\'\"}','::ffff:127.0.0.1','2026-04-08 02:47:00'),
(9,1,'testadmin',NULL,'POST /api/production/boms','PRODUCTION','SUCCESS','{\"body\":{\"name\":\"TEST\",\"description\":\"TESTES\",\"items\":[{\"itemId\":\"5\",\"quantity\":1,\"description\":\"\"}]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:47:07'),
(10,1,'testadmin',NULL,'PUT /api/production/boms/4','PRODUCTION','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:47:23'),
(11,1,'testadmin',NULL,'POST /api/notes','NOTES','SUCCESS','{\"body\":{\"title\":\"AA\",\"content\":\"aaa\",\"color\":\"#bbf7d0\",\"isPinned\":false},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:47:58'),
(12,1,'testadmin',NULL,'PUT /api/notes/1','NOTES','SUCCESS','{\"body\":{\"isPinned\":true},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:48:03'),
(13,1,'testadmin',NULL,'PUT /api/roles/2','ROLES','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:51:00'),
(14,1,'testadmin',NULL,'PUT /api/roles/2','ROLES','SUCCESS','{\"body\":{\"state\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 02:51:04'),
(15,1,'testadmin',NULL,'PUT /api/users/2','USERS','ERROR','{\"body\":{\"fullName\":\"Demo User\",\"username\":\"demo\",\"email\":\"demo@test.com\",\"phone\":\"05511345360\",\"departmentId\":2,\"selectedRoles\":[\"2\"]},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-08 03:17:06'),
(16,1,'testadmin',NULL,'PUT /api/users/2','USERS','ERROR','{\"body\":{\"fullName\":\"Demo User\",\"username\":\"demo\",\"email\":\"demo@test.com\",\"phone\":\"05511345360\",\"departmentId\":2,\"selectedRoles\":[\"1\"]},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-08 03:17:10'),
(17,1,'testadmin',NULL,'PUT /api/roles/1','ROLES','ERROR','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[\"2\"]},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-08 03:17:19'),
(18,1,'testadmin','','PUT /api/currencies/2/default','CURRENCIES','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:17:47'),
(19,1,'testadmin','','PUT /api/currencies/1/default','CURRENCIES','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:18:02'),
(20,1,'testadmin','','POST /api/items/code-groups','ITEMS','SUCCESS','{\"body\":{\"name\":\"MOBİLYA\",\"prefix\":\"MOB\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:18:18'),
(21,1,'testadmin','','PUT /api/roles/1','ROLES','ERROR','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"7\",\"8\",\"9\",\"10\",\"11\",\"12\",\"13\",\"14\",\"15\",\"16\",\"17\",\"18\",\"20\",\"21\",\"22\",\"23\",\"24\",\"25\",\"26\",\"27\",\"28\",\"29\",\"30\",\"31\",\"32\",\"33\",\"34\",\"35\",\"36\",\"37\",\"38\",\"39\",\"40\",\"41\",\"42\",\"43\",\"44\",\"45\"]},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-08 22:19:16'),
(22,1,'testadmin','','PUT /api/roles/1','ROLES','ERROR','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"7\",\"8\",\"9\",\"10\",\"11\",\"12\",\"13\",\"14\",\"15\",\"16\",\"17\",\"18\",\"23\",\"24\",\"25\",\"26\",\"27\",\"28\",\"29\",\"30\",\"31\",\"32\",\"33\",\"34\",\"35\",\"36\",\"37\",\"38\",\"39\",\"40\",\"41\",\"42\",\"43\",\"44\",\"45\"]},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-08 22:19:20'),
(23,1,'testadmin','','PUT /api/users/2','USERS','ERROR','{\"body\":{\"fullName\":\"Demo User\",\"username\":\"demo\",\"email\":\"demo@test.com\",\"phone\":\"05511345360\",\"departmentId\":2,\"selectedRoles\":[\"1\"]},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-08 22:28:48'),
(24,1,'testadmin','','POST /api/items','ITEMS','SUCCESS','{\"body\":{\"name\":\"TEST\",\"itemTypeId\":2,\"itemCodeGroupId\":1,\"criticalLimit\":0,\"purchasePrice\":5,\"salePrice\":5,\"currencyId\":3,\"quantityTypeId\":2,\"providerId\":null,\"kdv\":20,\"image\":\"\",\"description\":\"\",\"notes\":\"\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:31:50'),
(25,1,'testadmin','','POST /api/items','ITEMS','ERROR','{\"body\":{\"name\":\"TESTEEE\",\"itemTypeId\":1,\"itemCodeGroupId\":1,\"criticalLimit\":0,\"purchasePrice\":5,\"salePrice\":5,\"currencyId\":1,\"quantityTypeId\":0,\"providerId\":null,\"kdv\":20,\"image\":\"\",\"description\":\"\",\"notes\":\"\"},\"status\":\"ERROR\",\"response\":\"Cannot add or update a child row: a foreign key constraint fails (`benyaptim`.`items`, CONSTRAINT `FK_b57597a0f63c67d287482179bd3` FOREIGN KEY (`quantity_type_id`) REFERENCES `quantity_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION)\"}','::ffff:127.0.0.1','2026-04-08 22:32:15'),
(26,1,'testadmin','','POST /api/items','ITEMS','ERROR','{\"body\":{\"name\":\"TESTEEE\",\"itemTypeId\":1,\"itemCodeGroupId\":1,\"criticalLimit\":0,\"purchasePrice\":5,\"salePrice\":5,\"currencyId\":1,\"quantityTypeId\":0,\"providerId\":null,\"kdv\":20,\"image\":\"\",\"description\":\"\",\"notes\":\"\"},\"status\":\"ERROR\",\"response\":\"Cannot add or update a child row: a foreign key constraint fails (`benyaptim`.`items`, CONSTRAINT `FK_b57597a0f63c67d287482179bd3` FOREIGN KEY (`quantity_type_id`) REFERENCES `quantity_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION)\"}','::ffff:127.0.0.1','2026-04-08 22:32:17'),
(27,1,'testadmin','','POST /api/items','ITEMS','ERROR','{\"body\":{\"name\":\"TESTEEE\",\"itemTypeId\":1,\"itemCodeGroupId\":1,\"criticalLimit\":0,\"purchasePrice\":5,\"salePrice\":5,\"currencyId\":1,\"quantityTypeId\":0,\"providerId\":null,\"kdv\":20,\"image\":\"\",\"description\":\"\",\"notes\":\"\"},\"status\":\"ERROR\",\"response\":\"Cannot add or update a child row: a foreign key constraint fails (`benyaptim`.`items`, CONSTRAINT `FK_b57597a0f63c67d287482179bd3` FOREIGN KEY (`quantity_type_id`) REFERENCES `quantity_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION)\"}','::ffff:127.0.0.1','2026-04-08 22:32:24'),
(28,1,'testadmin','','POST /api/items','ITEMS','ERROR','{\"body\":{\"name\":\"TESTEEE\",\"itemTypeId\":1,\"itemCodeGroupId\":1,\"criticalLimit\":0,\"purchasePrice\":5,\"salePrice\":5,\"currencyId\":1,\"quantityTypeId\":0,\"providerId\":null,\"kdv\":20,\"image\":\"\",\"description\":\"\",\"notes\":\"\"},\"status\":\"ERROR\",\"response\":\"Cannot add or update a child row: a foreign key constraint fails (`benyaptim`.`items`, CONSTRAINT `FK_b57597a0f63c67d287482179bd3` FOREIGN KEY (`quantity_type_id`) REFERENCES `quantity_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION)\"}','::ffff:127.0.0.1','2026-04-08 22:32:25'),
(29,1,'testadmin','','POST /api/items','ITEMS','SUCCESS','{\"body\":{\"name\":\"A\",\"itemTypeId\":3,\"itemCodeGroupId\":1,\"criticalLimit\":0,\"purchasePrice\":5,\"salePrice\":5,\"currencyId\":1,\"quantityTypeId\":1,\"providerId\":null,\"kdv\":20,\"image\":\"\",\"description\":\"\",\"notes\":\"\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:34:19'),
(30,1,'testadmin','','POST /api/items','ITEMS','SUCCESS','{\"body\":{\"name\":\"A\",\"itemTypeId\":1,\"itemCodeGroupId\":1,\"criticalLimit\":0,\"purchasePrice\":5,\"salePrice\":5,\"currencyId\":1,\"quantityTypeId\":1,\"providerId\":null,\"kdv\":20,\"image\":\"\",\"description\":\"\",\"notes\":\"\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:34:38'),
(31,1,'testadmin','','PUT /api/roles/1','ROLES','ERROR','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"7\",\"8\",\"9\",\"10\",\"11\",\"12\",\"13\",\"14\",\"15\",\"16\",\"17\",\"18\",\"20\",\"21\",\"22\",\"23\",\"24\",\"25\",\"26\",\"27\",\"28\",\"29\",\"30\",\"31\",\"32\",\"33\",\"34\",\"35\",\"36\",\"37\",\"38\",\"39\",\"40\",\"41\",\"42\",\"43\",\"44\",\"45\"]},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-08 22:34:57'),
(32,1,'testadmin','','POST /api/users','USERS','ERROR','{\"body\":{\"fullName\":\"A\",\"username\":\"a\",\"password\":\"********\",\"email\":\"a@gmail.com\",\"phone\":\"0 (511) 111 11 11\",\"departmentId\":7,\"selectedRoles\":[\"1\"]},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-08 22:35:33'),
(33,1,'testadmin','','POST /api/notes','NOTES','SUCCESS','{\"body\":{\"title\":\"A\",\"content\":\"a\",\"color\":\"#e9d5ff\",\"isPinned\":false},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:40:08'),
(34,1,'testadmin','','POST /api/users','USERS','SUCCESS','{\"body\":{\"fullName\":\"AA\",\"username\":\"a\",\"password\":\"********\",\"email\":\"aaa@yahoo.com\",\"phone\":\"0 (555) 555 55 55\",\"departmentId\":8},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:40:33'),
(35,1,'testadmin','','POST /api/roles/assign','ROLES','SUCCESS','{\"body\":{\"userId\":\"4\",\"roleId\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:40:33'),
(36,1,'testadmin','','PUT /api/roles/1','ROLES','SUCCESS','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:40:55'),
(37,1,'testadmin','','PUT /api/roles/1','ROLES','SUCCESS','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:41:18'),
(38,1,'testadmin','','POST /api/departments','DEPARTMENTS','SUCCESS','{\"body\":{\"name\":\"AA\",\"description\":\"AAA\",\"abbreviation\":\"AAAA\",\"departmentTypeId\":2,\"commercialAccountId\":4},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:41:31'),
(39,1,'testadmin','','POST /api/roles/user-permissions','ROLES','SUCCESS','{\"body\":{\"userId\":\"4\",\"permissionId\":\"21\",\"effect\":\"allow\",\"scopeType\":\"global\",\"scopeId\":null},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:42:44'),
(40,1,'testadmin','','POST /api/roles/user-permissions','ROLES','SUCCESS','{\"body\":{\"userId\":\"4\",\"permissionId\":\"19\",\"effect\":\"allow\",\"scopeType\":\"global\",\"scopeId\":null},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:42:44'),
(41,1,'testadmin','','POST /api/roles/user-permissions','ROLES','SUCCESS','{\"body\":{\"userId\":\"4\",\"permissionId\":\"20\",\"effect\":\"allow\",\"scopeType\":\"global\",\"scopeId\":null},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:42:45'),
(42,1,'testadmin','','PUT /api/departments/7','DEPARTMENTS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:46:57'),
(43,1,'testadmin','','PUT /api/roles/1','ROLES','SUCCESS','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,21,19,20,22]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-08 22:47:07'),
(44,1,'testadmin','','POST /api/users','USERS','SUCCESS','{\"body\":{\"fullName\":\"AAAA\",\"username\":\"aaa\",\"password\":\"********\",\"email\":\"aaaa@gmail.com\",\"phone\":\"0 (555) 555 55 55\",\"departmentId\":6},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 16:01:25'),
(45,1,'testadmin','','POST /api/roles/assign','ROLES','SUCCESS','{\"body\":{\"userId\":\"5\",\"roleId\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 16:01:25'),
(46,1,'testadmin','','POST /api/roles','ROLES','SUCCESS','{\"body\":{\"name\":\"TEST\",\"permissionIds\":[]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 16:02:34'),
(47,1,'testadmin','','PUT /api/roles/3','ROLES','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 16:02:52'),
(48,1,'testadmin','','POST /api/items','ITEMS','SUCCESS','{\"body\":{\"name\":\"TESTEEEEEEEEEE\",\"itemTypeId\":3,\"itemCodeGroupId\":1,\"criticalLimit\":555,\"purchasePrice\":111111,\"salePrice\":111111,\"currencyId\":1,\"quantityTypeId\":3,\"providerId\":null,\"kdv\":55,\"image\":\"\",\"description\":\"\",\"notes\":\"\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 16:07:42'),
(49,1,'testadmin','','PUT /api/roles/3','ROLES','SUCCESS','{\"body\":{\"state\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 16:11:05'),
(50,1,'testadmin','','PUT /api/items/code-groups/1','ITEMS','ERROR','{\"body\":{\"state\":0},\"status\":\"ERROR\",\"response\":\"Bu grupta 4 adet aktif ürün bulunduğu için pasife alınamaz.\"}','::ffff:127.0.0.1','2026-04-11 16:33:29'),
(51,1,'testadmin','','POST /api/production/boms','PRODUCTION','SUCCESS','{\"body\":{\"name\":\"AAA\",\"description\":\"AAA\",\"items\":[{\"itemId\":\"13\",\"quantity\":1,\"description\":\"\"},{\"itemId\":\"13\",\"quantity\":1,\"description\":\"\"}]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 16:45:16'),
(52,1,'testadmin','','DELETE /api/items/quantity-types/13','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 17:20:50'),
(53,1,'testadmin','','DELETE /api/items/quantity-types/7','ITEMS','ERROR','{\"body\":null,\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan aktif ürünler bulunduğu için silinemez.\"}','::ffff:127.0.0.1','2026-04-11 17:20:56'),
(54,1,'testadmin','','PUT /api/items/quantity-types/7','ITEMS','ERROR','{\"body\":{\"state\":0},\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan 1 adet aktif ürün bulunduğu için pasife alınamaz.\"}','::ffff:127.0.0.1','2026-04-11 17:21:01'),
(55,1,'testadmin','','POST /api/items/quantity-types','ITEMS','SUCCESS','{\"body\":{\"name\":\"TEST\",\"abbreviation\":\"test\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 17:21:09'),
(56,1,'testadmin','','POST /api/production/orders','PRODUCTION','ERROR','{\"body\":{\"bomId\":3,\"plannedQuantity\":5000,\"startDate\":\"2026-04-11\",\"endDate\":\"2026-04-25\",\"notes\":\"\",\"status\":\"draft\",\"producedQuantity\":0,\"wastageQuantity\":0},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-11 17:22:48'),
(57,1,'testadmin','','POST /api/production/orders','PRODUCTION','ERROR','{\"body\":{\"bomId\":3,\"plannedQuantity\":5000,\"startDate\":\"2026-04-11\",\"endDate\":\"2026-04-25\",\"notes\":\"\",\"status\":\"draft\",\"producedQuantity\":0,\"wastageQuantity\":0},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-11 17:22:58'),
(58,1,'testadmin','','POST /api/production/orders','PRODUCTION','ERROR','{\"body\":{\"bomId\":3,\"plannedQuantity\":5000,\"startDate\":\"2026-04-11\",\"endDate\":\"2026-04-25\",\"notes\":\"\",\"status\":\"draft\",\"producedQuantity\":0,\"wastageQuantity\":0},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-11 17:22:58'),
(59,1,'testadmin','','PUT /api/users/5','USERS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:28:14'),
(60,1,'testadmin','','PUT /api/users/4','USERS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:28:19'),
(61,1,'testadmin','','PUT /api/users/2','USERS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:28:23'),
(62,1,'testadmin','','POST /api/departments','DEPARTMENTS','SUCCESS','{\"body\":{\"name\":\"İZMİT MAĞAZA\",\"description\":\"BAYRAM KARACA\",\"abbreviation\":\"MERM\",\"departmentTypeId\":2,\"commercialAccountId\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:30:24'),
(63,1,'testadmin','','POST /api/users','USERS','SUCCESS','{\"body\":{\"fullName\":\"BAYRAM KARACA\",\"username\":\"izmitmagaza\",\"password\":\"********\",\"email\":\"w@outlook.com\",\"phone\":\"+90 532 419 41 51\",\"departmentId\":10},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:31:41'),
(64,1,'testadmin','','POST /api/roles/assign','ROLES','SUCCESS','{\"body\":{\"userId\":\"6\",\"roleId\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:31:41'),
(65,1,'testadmin','','PUT /api/departments/8','DEPARTMENTS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:35:22'),
(66,1,'testadmin','','PUT /api/departments/9','DEPARTMENTS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:35:32'),
(67,1,'testadmin','','PUT /api/departments/2','DEPARTMENTS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:35:53'),
(68,1,'testadmin','','PUT /api/departments/6','DEPARTMENTS','SUCCESS','{\"body\":{\"name\":\"MERKEZ DEPO(IST)\",\"description\":\"ISMAIL ŞAHIN\",\"abbreviation\":\"DIST\",\"departmentTypeId\":2,\"commercialAccountId\":4},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:36:10'),
(69,1,'testadmin','','PUT /api/departments/6','DEPARTMENTS','SUCCESS','{\"body\":{\"name\":\"MERKEZ DEPO(IST)\",\"description\":\"ISMAIL ŞAHIN\",\"abbreviation\":\"DIST\",\"departmentTypeId\":2,\"commercialAccountId\":4},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:36:28'),
(70,1,'testadmin','','POST /api/accounts','ACCOUNTS','SUCCESS','{\"body\":{\"name\":\"ANA KASA ( MUSTAFA)\",\"bankName\":\"QNB ENPARA\",\"iban\":\"TR12 2314 1141 2412 4124 1241 41\",\"ibanName\":\"MEHMET ERBAY\",\"currencyId\":\"1\",\"criticalLimit\":1000000,\"description\":\"MUSTAFA ERBAY ANA KASA\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-11 18:44:44'),
(71,NULL,'SYSTEM','','POST /api/auth/login','AUTH','ERROR','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"ERROR\",\"response\":\"Unknown column \'User.failed_login_attempts\' in \'SELECT\'\"}','::ffff:127.0.0.1','2026-04-13 18:29:08'),
(72,NULL,'SYSTEM','','POST /api/auth/login','AUTH','ERROR','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"ERROR\",\"response\":\"Unknown column \'User.failed_login_attempts\' in \'SELECT\'\"}','::ffff:127.0.0.1','2026-04-13 18:29:17'),
(73,NULL,'SYSTEM','','POST /api/auth/login','AUTH','ERROR','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"ERROR\",\"response\":\"INVALID_PASSWORD\"}','::ffff:127.0.0.1','2026-04-13 18:33:09'),
(74,NULL,'SYSTEM','','POST /api/auth/login','AUTH','SUCCESS','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:33:16'),
(75,NULL,'SYSTEM','','POST /api/auth/login','AUTH','SUCCESS','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:33:29'),
(76,NULL,'SYSTEM','','POST /api/auth/login','AUTH','SUCCESS','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:34:11'),
(77,1,'testadmin','','PUT /api/items/quantity-types/14','ITEMS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:37:13'),
(78,1,'testadmin','','PUT /api/roles/3','ROLES','SUCCESS','{\"body\":{\"name\":\"TEST\",\"permissionIds\":[33,34]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:37:47'),
(79,1,'testadmin','','PUT /api/roles/1','ROLES','SUCCESS','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:37:58'),
(80,1,'testadmin','','PUT /api/roles/1','ROLES','SUCCESS','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,21,19,20,22]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:38:31'),
(81,1,'testadmin','','POST /api/production/boms','PRODUCTION','SUCCESS','{\"body\":{\"name\":\"TEST (KOPYA)\",\"description\":\"TESTES\",\"items\":[{\"itemId\":\"5\",\"quantity\":1,\"description\":\"\"},{\"itemId\":\"13\",\"quantity\":1,\"description\":\"\"},{\"itemId\":\"13\",\"quantity\":1,\"description\":\"\"},{\"itemId\":\"13\",\"quantity\":1,\"description\":\"\"},{\"itemId\":\"13\",\"quantity\":1,\"description\":\"\"}]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:46:02'),
(82,1,'testadmin','','PUT /api/items/code-groups/1','ITEMS','ERROR','{\"body\":{\"state\":0},\"status\":\"ERROR\",\"response\":\"Bu grupta 4 adet aktif ürün bulunduğu için pasife alınamaz.\"}','::ffff:127.0.0.1','2026-04-13 18:47:54'),
(83,1,'testadmin','','DELETE /api/items/quantity-types/14','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:49:02'),
(84,1,'testadmin','','DELETE /api/items/quantity-types/3','ITEMS','ERROR','{\"body\":null,\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan aktif ürünler bulunduğu için silinemez.\"}','::ffff:127.0.0.1','2026-04-13 18:49:10'),
(85,1,'testadmin','','PUT /api/items/quantity-types/3','ITEMS','ERROR','{\"body\":{\"state\":0},\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan 1 adet aktif ürün bulunduğu için pasife alınamaz.\"}','::ffff:127.0.0.1','2026-04-13 18:49:20'),
(86,1,'testadmin','','PUT /api/items/quantity-types/10','ITEMS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:54:43'),
(87,1,'testadmin','','PUT /api/items/quantity-types/9','ITEMS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:54:49'),
(88,1,'testadmin','','PUT /api/items/quantity-types/8','ITEMS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:54:54'),
(89,1,'testadmin','','PUT /api/items/quantity-types/7','ITEMS','ERROR','{\"body\":{\"state\":0},\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan 1 adet aktif ürün bulunduğu için pasife alınamaz.\"}','::ffff:127.0.0.1','2026-04-13 18:54:59'),
(90,1,'testadmin','','PUT /api/items/quantity-types/12','ITEMS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:55:24'),
(91,1,'testadmin','','PUT /api/items/quantity-types/8','ITEMS','SUCCESS','{\"body\":{\"state\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:55:28'),
(92,1,'testadmin','','PUT /api/items/quantity-types/9','ITEMS','SUCCESS','{\"body\":{\"state\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:55:31'),
(93,1,'testadmin','','PUT /api/items/quantity-types/10','ITEMS','SUCCESS','{\"body\":{\"state\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:55:35'),
(94,1,'testadmin','','PUT /api/items/quantity-types/12','ITEMS','SUCCESS','{\"body\":{\"state\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:55:38'),
(95,1,'testadmin','','PUT /api/items/quantity-types/8','ITEMS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:56:09'),
(96,1,'testadmin','','DELETE /api/items/quantity-types/3','ITEMS','ERROR','{\"body\":null,\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan aktif ürünler bulunduğu için silinemez.\"}','::ffff:127.0.0.1','2026-04-13 18:56:15'),
(97,1,'testadmin','','PUT /api/items/quantity-types/8','ITEMS','SUCCESS','{\"body\":{\"state\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 18:56:21'),
(98,1,'testadmin','','PUT /api/items/quantity-types/8','ITEMS','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:01:47'),
(99,1,'testadmin','','DELETE /api/items/quantity-types/8','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:01:52'),
(100,1,'testadmin','','DELETE /api/items/quantity-types/1','ITEMS','ERROR','{\"body\":null,\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan aktif ürünler bulunduğu için silinemez.\"}','::ffff:127.0.0.1','2026-04-13 19:02:03'),
(101,1,'testadmin','','PUT /api/items/quantity-types/1','ITEMS','ERROR','{\"body\":{\"state\":0},\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan 4 adet aktif ürün bulunduğu için pasife alınamaz.\"}','::ffff:127.0.0.1','2026-04-13 19:02:09'),
(102,1,'testadmin','','DELETE /api/items/quantity-types/9','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:02:19'),
(103,1,'testadmin','','PUT /api/items/quantity-types/2','ITEMS','ERROR','{\"body\":{\"state\":0},\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan 2 adet aktif ürün bulunduğu için pasife alınamaz.\"}','::ffff:127.0.0.1','2026-04-13 19:02:25'),
(104,1,'testadmin','','DELETE /api/items/quantity-types/2','ITEMS','ERROR','{\"body\":null,\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan aktif ürünler bulunduğu için silinemez.\"}','::ffff:127.0.0.1','2026-04-13 19:02:30'),
(105,1,'testadmin','','DELETE /api/items/quantity-types/3','ITEMS','ERROR','{\"body\":null,\"status\":\"ERROR\",\"response\":\"Bu birimi kullanan aktif ürünler bulunduğu için silinemez.\"}','::ffff:127.0.0.1','2026-04-13 19:02:37'),
(106,1,'testadmin','','DELETE /api/items/quantity-types/10','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:02:46'),
(107,1,'testadmin','','DELETE /api/items/quantity-types/5','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:02:51'),
(108,1,'testadmin','','DELETE /api/departments/types/5','DEPARTMENTS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:03:58'),
(109,1,'testadmin','','DELETE /api/departments/types/4','DEPARTMENTS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:04:08'),
(110,1,'testadmin','','DELETE /api/departments/types/6','DEPARTMENTS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:04:15'),
(111,1,'testadmin','','DELETE /api/departments/types/7','DEPARTMENTS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:04:23'),
(112,1,'testadmin','','DELETE /api/departments/types/8','DEPARTMENTS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:04:28'),
(113,1,'testadmin','','POST /api/roles/user-permissions','ROLES','SUCCESS','{\"body\":{\"userId\":\"6\",\"permissionId\":\"21\",\"effect\":\"allow\",\"scopeType\":\"global\",\"scopeId\":null},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:07:24'),
(114,1,'testadmin','','POST /api/roles/user-permissions','ROLES','SUCCESS','{\"body\":{\"userId\":\"6\",\"permissionId\":\"21\",\"effect\":\"allow\",\"scopeType\":\"global\",\"scopeId\":null},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:07:30'),
(115,1,'testadmin','','PUT /api/production/boms/7','PRODUCTION','SUCCESS','{\"body\":{\"state\":0},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 19:26:49'),
(116,NULL,'SYSTEM','','POST /api/auth/login','AUTH','ERROR','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"ERROR\",\"response\":\"INVALID_PASSWORD\"}','::ffff:127.0.0.1','2026-04-13 21:47:06'),
(117,NULL,'SYSTEM','','POST /api/auth/login','AUTH','SUCCESS','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:47:16'),
(118,1,'testadmin','','POST /api/users','USERS','ERROR','{\"body\":{\"fullName\":\"Test Admin\",\"username\":\"testadmin\",\"password\":\"********\",\"email\":\"admin@test.com\",\"phone\":\"+90 551 134 53 60\",\"departmentId\":4},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-13 21:54:48'),
(119,1,'testadmin','','POST /api/users','USERS','ERROR','{\"body\":{\"fullName\":\"Test Admin\",\"username\":\"testadmin\",\"password\":\"********\",\"email\":\"admin@test.com\",\"phone\":\"+90 551 134 53 60\",\"departmentId\":6},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-13 21:55:09'),
(120,1,'testadmin','','POST /api/notes','NOTES','SUCCESS','{\"body\":{\"title\":\"A\",\"content\":\"a\",\"color\":\"#e9d5ff\",\"isPinned\":false},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:55:55'),
(121,1,'testadmin','','POST /api/users','USERS','ERROR','{\"body\":{\"fullName\":\"BAYRAM KARACAA\",\"username\":\"izmitmagaza\",\"password\":\"********\",\"email\":\"w@outlook.com\",\"phone\":\"+90 532 419 41 51\",\"departmentId\":10},\"status\":\"ERROR\",\"response\":\"Bad Request Exception\"}','::ffff:127.0.0.1','2026-04-13 21:56:09'),
(122,1,'testadmin','','PUT /api/roles/3','ROLES','SUCCESS','{\"body\":{\"name\":\"TEST\",\"permissionIds\":[33,34,37]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:56:17'),
(123,1,'testadmin','','PUT /api/roles/1','ROLES','SUCCESS','{\"body\":{\"name\":\"Admin\",\"permissionIds\":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:56:22'),
(124,1,'testadmin','','PUT /api/departments/10','DEPARTMENTS','SUCCESS','{\"body\":{\"name\":\"İZMİT MAĞAZA\",\"description\":\"BAYRAM KARACA\",\"abbreviation\":\"MER\",\"departmentTypeId\":2,\"commercialAccountId\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:56:32'),
(125,1,'testadmin','','PUT /api/departments/10','DEPARTMENTS','SUCCESS','{\"body\":{\"name\":\"İZMİT MAĞAZA\",\"description\":\"BAYRAM KARACA\",\"abbreviation\":\"MERM\",\"departmentTypeId\":2,\"commercialAccountId\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:56:39'),
(126,1,'testadmin','','PUT /api/items/types/4','ITEMS','SUCCESS','{\"body\":{\"state\":1},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:58:07'),
(127,1,'testadmin','','DELETE /api/items/types/7','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:58:15'),
(128,1,'testadmin','','DELETE /api/items/types/9','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:58:21'),
(129,1,'testadmin','','DELETE /api/items/types/10','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:58:31'),
(130,1,'testadmin','','DELETE /api/items/types/12','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:58:37'),
(131,1,'testadmin','','DELETE /api/items/types/15','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:58:41'),
(132,1,'testadmin','','DELETE /api/items/types/14','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:58:46'),
(133,1,'testadmin','','DELETE /api/items/types/13','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:58:51'),
(134,1,'testadmin','','DELETE /api/items/types/11','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:58:57'),
(135,1,'testadmin','','DELETE /api/items/types/5','ITEMS','SUCCESS','{\"body\":null,\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:59:03'),
(136,1,'testadmin','','PUT /api/production/boms/1','PRODUCTION','SUCCESS','{\"body\":{\"name\":\"menemen\",\"description\":\"mennnnememen\",\"items\":[{\"itemId\":\"1\",\"quantity\":13,\"description\":\"aaa\"},{\"itemId\":1,\"quantity\":41,\"description\":\"a\"}]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:59:35'),
(137,1,'testadmin','','PUT /api/production/boms/6','PRODUCTION','SUCCESS','{\"body\":{\"name\":\"AAA\",\"description\":\"AAA\",\"items\":[{\"itemId\":\"13\",\"quantity\":2,\"description\":\"\"},{\"itemId\":12,\"quantity\":1,\"description\":\"\"}]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 21:59:48'),
(138,1,'testadmin','','POST /api/production/boms','PRODUCTION','SUCCESS','{\"body\":{\"name\":\"ZZZZZZ\",\"description\":\"\",\"items\":[{\"itemId\":\"13\",\"quantity\":1,\"description\":\"\"}]},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-13 22:00:50'),
(139,NULL,'SYSTEM','','POST /api/auth/login','AUTH','ERROR','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"ERROR\",\"response\":\"INVALID_PASSWORD\"}','::ffff:127.0.0.1','2026-04-14 08:27:55'),
(140,NULL,'SYSTEM','','POST /api/auth/login','AUTH','ERROR','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"ERROR\",\"response\":\"INVALID_PASSWORD\"}','::ffff:127.0.0.1','2026-04-14 08:28:00'),
(141,NULL,'SYSTEM','','POST /api/auth/login','AUTH','SUCCESS','{\"body\":{\"username\":\"testadmin\",\"password\":\"********\"},\"status\":\"SUCCESS\",\"response\":\"OK\"}','::ffff:127.0.0.1','2026-04-14 08:28:09');
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_sequences`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `transaction_sequences` WRITE;
/*!40000 ALTER TABLE `transaction_sequences` DISABLE KEYS */;
INSERT INTO `transaction_sequences` VALUES
(1,'MKB',2,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1),
(2,'TDY',1,1,'2026-03-31 16:28:21',NULL,'2026-03-31 16:28:21',NULL,1),
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
  `party_id` bigint(20) NOT NULL,
  `commercial_account_id` bigint(20) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency_id` bigint(20) DEFAULT NULL,
  `exchange_rate` decimal(15,6) NOT NULL DEFAULT 1.000000,
  `type` enum('in','out') NOT NULL,
  `reference_type` enum('sale','purchase','manual_adjustment') DEFAULT NULL,
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
  KEY `fk_tx_created_by` (`created_by`),
  KEY `fk_tx_updated_by` (`updated_by`),
  KEY `FK_9b7e25a06ce7744d8688691f64a` (`party_id`),
  KEY `FK_b85c978f6e3205d58eb5726db23` (`commercial_account_id`),
  KEY `FK_b515faccedf1dc36ac4f78acc04` (`currency_id`),
  CONSTRAINT `FK_9b7e25a06ce7744d8688691f64a` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_b515faccedf1dc36ac4f78acc04` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_b85c978f6e3205d58eb5726db23` FOREIGN KEY (`commercial_account_id`) REFERENCES `commercial_accounts` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES
(1,'MKB-001',1,1,50000.00,NULL,1.000000,'in',NULL,NULL,'2026-04-07','A','completed',1,'2026-04-07 04:00:30.996473',NULL,'2026-04-07 04:00:30.996473',NULL,1);
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
  `color` varchar(20) DEFAULT '#ffffff' COMMENT 'Not arka plan rengi',
  `is_pinned` tinyint(1) DEFAULT 0 COMMENT 'Sabitlenmiş not',
  `state` tinyint(1) DEFAULT 1 COMMENT '1=aktif, 0=silinmiş',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_pinned` (`is_pinned`),
  CONSTRAINT `fk_user_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_notes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user_notes` WRITE;
/*!40000 ALTER TABLE `user_notes` DISABLE KEYS */;
INSERT INTO `user_notes` VALUES
(1,1,'AA','aaa','#bbf7d0',1,1,'2026-04-08 02:47:58','2026-04-08 02:48:03'),
(2,1,'A','a','#e9d5ff',0,1,'2026-04-08 22:40:08','2026-04-08 22:40:08'),
(3,1,'A','a','#e9d5ff',0,1,'2026-04-13 21:55:55','2026-04-13 21:55:55');
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
  KEY `fk_up_created_by` (`created_by`),
  KEY `fk_up_updated_by` (`updated_by`),
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
(4,1),
(5,1),
(6,1);
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
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department_id` bigint(20) DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp(6) NULL DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  KEY `fk_users_created_by` (`created_by`),
  KEY `fk_users_updated_by` (`updated_by`),
  KEY `FK_0921d1972cf861d568f5271cd85` (`department_id`),
  CONSTRAINT `FK_0921d1972cf861d568f5271cd85` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'testadmin','$2b$12$.JTpsIEzqb182ZviAq2jQ.y/DaOP.iVHLMd.UqjpJg0X.ziBnRLfa','Test Admin','admin@test.com',NULL,NULL,0,NULL,'2026-03-30 17:58:43.000000',NULL,'2026-04-14 08:28:09.000000',NULL,1),
(2,'demo','$2b$12$izpdLlyvIKIeu50JeBN15eRfdDcciY9MQlN39/ukuxPUenLjoOJgi','Demo User','demo@test.com','05511345360',2,0,NULL,'2026-03-30 18:18:51.000000',1,'2026-04-11 18:28:23.000000',NULL,0),
(3,'test','$2b$12$nr04BJNn0dzfvLU9eQ5pmeaNBgF70vuYaPYZiU0v29Uwe82sTiLfa','test','test@gamil.com','05511345360',2,0,1,'2026-04-04 12:13:13.000000',1,'2026-04-04 12:14:08.000000','2026-04-04 12:14:08.000000',1),
(4,'a','$2b$12$01dAnYxxFwtnCeSk2xVlq.yWlFlXay6hYaRfWMDnU1HjcWJ8AdyEu','AA','aaa@yahoo.com','0 (555) 555 55 55',8,0,1,'2026-04-08 22:40:33.294807',1,'2026-04-11 18:28:19.000000',NULL,0),
(5,'aaa','$2b$12$zd1h/rGywWgj94M1S8eIY.BPRaBI5Ehwx.86wqCtW1CTW5B7Jh3iW','AAAA','aaaa@gmail.com','0 (555) 555 55 55',6,0,1,'2026-04-11 16:01:25.411580',1,'2026-04-11 18:28:14.000000',NULL,0),
(6,'izmitmagaza','$2b$12$eiHv/U.JkSucafGuxzWt3e6CP2DXtad1gU.AxGfoPjMaPdAN5WVAu','BAYRAM KARACA','w@outlook.com','+90 532 419 41 51',10,0,1,'2026-04-11 18:31:41.038615',NULL,'2026-04-11 18:31:41.038615',NULL,1);
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

-- Dump completed on 2026-04-14 12:12:31
