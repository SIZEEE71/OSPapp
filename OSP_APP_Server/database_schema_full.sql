-- MySQL dump 10.13  Distrib 8.0.41, for Linux (aarch64)
--
-- Host: localhost    Database: osp_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alarm_crew`
--

DROP TABLE IF EXISTS `alarm_crew`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alarm_crew` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `alarm_id` int unsigned NOT NULL COMMENT 'ID alarmu',
  `firefighter_id` int unsigned NOT NULL COMMENT 'ID strażaka',
  `position` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Pozycja w załodze (Kierowca, Dowódca, Strażak)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_position` (`alarm_id`,`position`),
  KEY `idx_alarm_id` (`alarm_id`),
  KEY `idx_firefighter_id` (`firefighter_id`),
  CONSTRAINT `alarm_crew_ibfk_1` FOREIGN KEY (`alarm_id`) REFERENCES `alarms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `alarm_crew_ibfk_2` FOREIGN KEY (`firefighter_id`) REFERENCES `firefighters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alarm_crew`
--

LOCK TABLES `alarm_crew` WRITE;
/*!40000 ALTER TABLE `alarm_crew` DISABLE KEYS */;
INSERT INTO `alarm_crew` VALUES (13,26,6,'Kierowca','2026-01-13 10:36:31','2026-01-13 10:36:31');
/*!40000 ALTER TABLE `alarm_crew` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alarm_responses`
--

DROP TABLE IF EXISTS `alarm_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alarm_responses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `alarm_id` int unsigned NOT NULL,
  `firefighter_id` int unsigned NOT NULL,
  `responded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Czas odpowiedzi na alarm',
  `response_type` enum('TAK','NIE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NIE' COMMENT 'Odpowiedź strażaka na alarm: TAK/NIE (brak odpowiedzi = NIE)',
  `arrival_time` datetime DEFAULT NULL COMMENT 'Czas przyjazdu do remizy',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_alarm_firefighter` (`alarm_id`,`firefighter_id`),
  KEY `idx_alarm_id` (`alarm_id`),
  KEY `idx_firefighter_id` (`firefighter_id`),
  KEY `idx_response_type` (`response_type`),
  CONSTRAINT `fk_response_alarm` FOREIGN KEY (`alarm_id`) REFERENCES `alarms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_response_firefighter` FOREIGN KEY (`firefighter_id`) REFERENCES `firefighters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alarm_responses`
--

LOCK TABLES `alarm_responses` WRITE;
/*!40000 ALTER TABLE `alarm_responses` DISABLE KEYS */;
INSERT INTO `alarm_responses` VALUES (53,26,6,'2025-12-27 13:16:18','TAK',NULL),(56,27,6,'2025-12-29 07:56:00','NIE',NULL),(59,28,6,'2025-12-29 08:53:42','NIE',NULL);
/*!40000 ALTER TABLE `alarm_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alarms`
--

DROP TABLE IF EXISTS `alarms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alarms` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `alarm_time` datetime NOT NULL COMMENT 'Czas alarmu',
  `end_time` datetime DEFAULT NULL COMMENT 'Czas zakończenia alarmu',
  `alarm_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Typ alarmu: pożar, wypadek, fałszywy itp.',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Miejsce zdarzenia',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Opis zdarzenia',
  `vehicle_id` int DEFAULT NULL COMMENT 'Pojazd wysłany do alarmu',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `call_phone_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Numer telefonu z którego przyszło połączenie',
  PRIMARY KEY (`id`),
  KEY `idx_alarm_time` (`alarm_time`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_call_phone_number` (`call_phone_number`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alarms`
--

LOCK TABLES `alarms` WRITE;
/*!40000 ALTER TABLE `alarms` DISABLE KEYS */;
INSERT INTO `alarms` VALUES (26,'2025-12-27 14:07:07','2025-12-27 14:16:42',NULL,NULL,NULL,2,'2025-12-27 13:07:08','2026-01-13 10:36:20','48608101402'),(27,'2025-12-29 08:55:43','2025-12-29 08:56:15',NULL,NULL,NULL,NULL,'2025-12-29 07:55:45','2025-12-29 07:56:17','48608101402'),(28,'2025-12-29 09:03:44','2025-12-29 09:53:42',NULL,NULL,NULL,NULL,'2025-12-29 08:03:46','2025-12-29 08:53:44','48608101402');
/*!40000 ALTER TABLE `alarms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_categories`
--

DROP TABLE IF EXISTS `equipment_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_categories`
--

LOCK TABLES `equipment_categories` WRITE;
/*!40000 ALTER TABLE `equipment_categories` DISABLE KEYS */;
INSERT INTO `equipment_categories` VALUES (1,'wyjazdowy','Strój wyjazdowy','2025-11-25 21:13:17'),(2,'wyjsciowy','Strój wyjściowy','2025-11-25 21:13:17'),(3,'koszarowy','Strój koszarowy','2025-11-25 21:13:17');
/*!40000 ALTER TABLE `equipment_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_items`
--

DROP TABLE IF EXISTS `equipment_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int unsigned NOT NULL,
  `item_key` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_item_key` (`item_key`),
  KEY `ix_category` (`category_id`),
  CONSTRAINT `fk_item_category` FOREIGN KEY (`category_id`) REFERENCES `equipment_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_items`
--

LOCK TABLES `equipment_items` WRITE;
/*!40000 ALTER TABLE `equipment_items` DISABLE KEYS */;
INSERT INTO `equipment_items` VALUES (1,1,'nomex','Nomex / kombinezon','2025-11-25 21:13:48'),(2,1,'helm','Hełm','2025-11-25 21:13:48'),(3,1,'rekawice_tech','Rękawice techniczne','2025-11-25 21:13:48'),(4,1,'rekawice_poz','Rękawice pożarnicze','2025-11-25 21:13:48'),(5,1,'latarka','Latarka','2025-11-25 21:13:48'),(6,2,'garnitur','Garnitur','2025-11-25 21:13:48'),(7,2,'czapka_rogatywka','Czapka rogatywka','2025-11-25 21:13:48'),(8,2,'spodnie_garn','Spodnie do garnituru','2025-11-25 21:13:48'),(9,3,'buty','Buty koszarowe','2025-11-25 21:13:48'),(11,1,'buty_gumowe','Buty gumowe','2025-12-30 14:07:52'),(12,1,'kominiarka','Kominiarka','2025-12-30 14:07:52'),(13,2,'sznur_galowy','Sznur galowy','2025-12-30 14:08:06'),(14,2,'rekawiczki_biale','Białe rękawiczki','2025-12-30 14:08:06'),(15,3,'podkoszulek','Podkoszulek','2025-12-30 14:08:10'),(16,3,'kurtka_koszarowa','Kurtka koszarowa','2025-12-30 14:08:10'),(17,3,'spodnie_koszarowe','Spodnie koszarowe','2025-12-30 14:08:10'),(18,3,'czapka_koszarowa','Czapka koszarowa','2025-12-30 14:08:10');
/*!40000 ALTER TABLE `equipment_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `firefighter_equipment`
--

DROP TABLE IF EXISTS `firefighter_equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `firefighter_equipment` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `firefighter_id` int unsigned NOT NULL,
  `equipment_item_id` int unsigned NOT NULL,
  `selected` tinyint(1) NOT NULL DEFAULT '0',
  `quantity` int NOT NULL DEFAULT '1',
  `condition` enum('Nowy','Dobry','Zuzyty') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Dobry',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_firefighter_item` (`firefighter_id`,`equipment_item_id`),
  KEY `ix_firefighter` (`firefighter_id`),
  KEY `fk_fe_item` (`equipment_item_id`),
  CONSTRAINT `fk_fe_firefighter` FOREIGN KEY (`firefighter_id`) REFERENCES `firefighters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fe_item` FOREIGN KEY (`equipment_item_id`) REFERENCES `equipment_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firefighter_equipment`
--

LOCK TABLES `firefighter_equipment` WRITE;
/*!40000 ALTER TABLE `firefighter_equipment` DISABLE KEYS */;
INSERT INTO `firefighter_equipment` VALUES (81,6,1,1,1,'Zuzyty','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(82,6,2,1,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(83,6,3,1,1,'Nowy','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(84,6,4,1,1,'Nowy','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(85,6,5,1,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(86,6,11,1,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(87,6,12,1,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(88,6,6,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(89,6,7,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(90,6,8,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(91,6,13,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(92,6,14,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(93,6,9,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(94,6,15,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(95,6,16,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(96,6,17,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19'),(97,6,18,0,1,'Dobry','','2025-12-30 14:08:51','2025-12-30 14:09:19');
/*!40000 ALTER TABLE `firefighter_equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `firefighter_groups`
--

DROP TABLE IF EXISTS `firefighter_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `firefighter_groups` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firefighter_groups`
--

LOCK TABLES `firefighter_groups` WRITE;
/*!40000 ALTER TABLE `firefighter_groups` DISABLE KEYS */;
INSERT INTO `firefighter_groups` VALUES (1,'JOT','Jednostka Operacyjno-Taktyczna','2025-12-02 23:49:25','2025-12-02 23:49:25'),(2,'czynny','Strażak czynny','2025-12-02 23:49:25','2025-12-02 23:49:25'),(3,'wspierający','Strażak wspierający','2025-12-02 23:49:25','2025-12-02 23:49:25'),(4,'brak','Brak grupy','2025-12-02 23:49:25','2025-12-02 23:49:25');
/*!40000 ALTER TABLE `firefighter_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `firefighter_languages`
--

DROP TABLE IF EXISTS `firefighter_languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `firefighter_languages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `firefighter_id` int unsigned NOT NULL,
  `language_id` int unsigned NOT NULL,
  `proficiency_level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Poziom biegłości: podstawowy, średniozaawansowany, zaawansowany, płynny',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_firefighter_language` (`firefighter_id`,`language_id`),
  KEY `idx_firefighter` (`firefighter_id`),
  KEY `idx_language` (`language_id`),
  CONSTRAINT `firefighter_languages_ibfk_1` FOREIGN KEY (`firefighter_id`) REFERENCES `firefighters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `firefighter_languages_ibfk_2` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firefighter_languages`
--

LOCK TABLES `firefighter_languages` WRITE;
/*!40000 ALTER TABLE `firefighter_languages` DISABLE KEYS */;
INSERT INTO `firefighter_languages` VALUES (2,6,10,'Zaawansowany','2025-12-04 20:01:18');
/*!40000 ALTER TABLE `firefighter_languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `firefighter_trainings`
--

DROP TABLE IF EXISTS `firefighter_trainings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `firefighter_trainings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `firefighter_id` int unsigned NOT NULL,
  `training_id` int unsigned NOT NULL,
  `completion_date` date DEFAULT NULL COMMENT 'Data ukończenia szkolenia',
  `validity_until` date DEFAULT NULL COMMENT 'Data ważności szkolenia',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_firefighter_training` (`firefighter_id`,`training_id`),
  KEY `idx_firefighter` (`firefighter_id`),
  KEY `idx_training` (`training_id`),
  KEY `idx_validity` (`validity_until`),
  CONSTRAINT `firefighter_trainings_ibfk_1` FOREIGN KEY (`firefighter_id`) REFERENCES `firefighters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `firefighter_trainings_ibfk_2` FOREIGN KEY (`training_id`) REFERENCES `trainings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firefighter_trainings`
--

LOCK TABLES `firefighter_trainings` WRITE;
/*!40000 ALTER TABLE `firefighter_trainings` DISABLE KEYS */;
/*!40000 ALTER TABLE `firefighter_trainings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `firefighters`
--

DROP TABLE IF EXISTS `firefighters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `firefighters` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `surname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rank_id` int unsigned DEFAULT NULL,
  `group_id` int unsigned DEFAULT NULL,
  `blood_type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `birth_place` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pesel` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_since` date DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `receives_equivalent` tinyint(1) DEFAULT '0',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `locality` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `street` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `house_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `periodic_exam_until` date DEFAULT NULL,
  `data_processing_consent` tinyint(1) DEFAULT '0',
  `station_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `contributions_paid` tinyint(1) DEFAULT '0',
  `contributions_paid_date` date DEFAULT NULL,
  `contributions_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pesel` (`pesel`),
  KEY `idx_rank_id` (`rank_id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_surname` (`surname`),
  KEY `idx_pesel` (`pesel`),
  KEY `idx_phone_number` (`phone_number`),
  KEY `idx_station_name` (`station_name`),
  CONSTRAINT `firefighters_ibfk_1` FOREIGN KEY (`rank_id`) REFERENCES `ranks` (`id`) ON DELETE SET NULL,
  CONSTRAINT `firefighters_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `firefighter_groups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firefighters`
--

LOCK TABLES `firefighters` WRITE;
/*!40000 ALTER TABLE `firefighters` DISABLE KEYS */;
INSERT INTO `firefighters` VALUES (6,'Mateusz','Pawłowski','123123123',12,1,'Rh-','2002-01-17','Tuchów','Andrzej','12345678911','2001-03-17',NULL,1,'Test@gmail.com','Bilsko',NULL,NULL,'518545200','2026-10-12',1,NULL,'2025-12-03 16:10:04','2026-01-13 10:38:57',0,NULL,'2026-01-13 10:38:57');
/*!40000 ALTER TABLE `firefighters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `languages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nazwa języka',
  `code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kod języka (pl, en, de, itp)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `languages`
--

LOCK TABLES `languages` WRITE;
/*!40000 ALTER TABLE `languages` DISABLE KEYS */;
INSERT INTO `languages` VALUES (9,'Polski','pl','2025-12-02 23:50:10'),(10,'Angielski','en','2025-12-02 23:50:10'),(11,'Niemiecki','de','2025-12-02 23:50:10'),(12,'Francuski','fr','2025-12-02 23:50:10'),(13,'Rosyjski','ru','2025-12-02 23:50:10'),(14,'Ukraiński','uk','2025-12-02 23:50:10'),(15,'Czeski','cs','2025-12-02 23:50:10');
/*!40000 ALTER TABLE `languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `latest_locations`
--

DROP TABLE IF EXISTS `latest_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `latest_locations` (
  `firefighter_id` bigint NOT NULL,
  `lat` decimal(9,6) NOT NULL,
  `lng` decimal(9,6) NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`firefighter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `latest_locations`
--

LOCK TABLES `latest_locations` WRITE;
/*!40000 ALTER TABLE `latest_locations` DISABLE KEYS */;
INSERT INTO `latest_locations` VALUES (4,49.765766,20.642585,NULL,'2025-12-14 23:01:42'),(6,49.753487,20.650551,NULL,'2025-12-29 08:53:04'),(9,49.755000,20.630000,NULL,'2025-12-29 08:52:39');
/*!40000 ALTER TABLE `latest_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_items`
--

DROP TABLE IF EXISTS `medical_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nazwa wyposażenia medycznego',
  `quantity` int NOT NULL DEFAULT '1' COMMENT 'Ilość sztuk',
  `expiry_date` date DEFAULT NULL COMMENT 'Data ważności',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Opis lub notatki',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expiry_date` (`expiry_date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_items`
--

LOCK TABLES `medical_items` WRITE;
/*!40000 ALTER TABLE `medical_items` DISABLE KEYS */;
INSERT INTO `medical_items` VALUES (1,'Bandaże uciskowe',1,'2026-12-05','','2025-12-27 12:45:10','2025-12-27 12:48:00');
/*!40000 ALTER TABLE `medical_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ranks`
--

DROP TABLE IF EXISTS `ranks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ranks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kategoria: strażacy, zarząd, komisja',
  `distinction_symbol` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Dystynkcja',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ranks`
--

LOCK TABLES `ranks` WRITE;
/*!40000 ALTER TABLE `ranks` DISABLE KEYS */;
INSERT INTO `ranks` VALUES (1,'Strażak','strażacy','─',1,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(2,'Starszy strażak','strażacy','──',2,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(3,'Dowódca roty','strażacy','┌─',3,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(4,'Pomocnik dowódcy sekcji','strażacy','┌──',4,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(5,'Dowódca sekcji','strażacy','┌───',5,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(6,'Pomocnik dowódcy plutonu','strażacy','├─',6,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(7,'Dowódca plutonu','strażacy','├──',7,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(8,'Członek zarządu','zarząd','◆',1,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(9,'Zastępca naczelnika','zarząd','◆◆',2,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(10,'Wiceprezes','zarząd','◆◆◆',3,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(11,'Naczelnik','zarząd','◆◆◆◆',4,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(12,'Prezes','zarząd','◆◆◆◆◆',5,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(13,'Członek komisji rewizyjnej','komisja','■',1,'2025-12-02 22:44:55','2025-12-02 22:44:55'),(14,'Przewodniczący komisji rewizyjnej','komisja','■■',2,'2025-12-02 22:44:55','2025-12-02 22:44:55');
/*!40000 ALTER TABLE `ranks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `alarm_id` int unsigned NOT NULL COMMENT 'ID alarmu którego dotyczy raport',
  `report_date` date NOT NULL COMMENT 'Data utworzenia raportu',
  `report_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Numer raportu',
  `created_by` int unsigned DEFAULT NULL COMMENT 'ID strażaka który stworzył raport',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `report_number` (`report_number`),
  KEY `created_by` (`created_by`),
  KEY `idx_alarm_id` (`alarm_id`),
  KEY `idx_report_date` (`report_date`),
  KEY `idx_report_number` (`report_number`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`alarm_id`) REFERENCES `alarms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `firefighters` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `station_equipment`
--

DROP TABLE IF EXISTS `station_equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `station_equipment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nazwa jednostki OSP (opcjonalne)',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nazwa sprzętu',
  `category_slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kategoria sprzętu (pompa, agregat, oświetlenie, etc)',
  `quantity` int NOT NULL DEFAULT '1' COMMENT 'Ilość sztuk',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Gdzie sprzęt się znajduje (magazyn, wóz, itp)',
  `equipment_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Typ sprzętu (przenośny, stacjonarny, itd)',
  `parameters` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON z parametrami sprzętu',
  `production_year` int DEFAULT NULL COMMENT 'Rok produkcji',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Opis sprzętu',
  `last_inspection_date` date DEFAULT NULL COMMENT 'Data ostatniego przeglądu',
  `next_inspection_date` date DEFAULT NULL COMMENT 'Data następnego przeglądu',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_station_name` (`station_name`),
  KEY `idx_category_slug` (`category_slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `station_equipment`
--

LOCK TABLES `station_equipment` WRITE;
/*!40000 ALTER TABLE `station_equipment` DISABLE KEYS */;
INSERT INTO `station_equipment` VALUES (1,NULL,'Agregat prądotwórczy ','Agregat',1,'Volvo','Agregat',NULL,2015,NULL,NULL,NULL,'2025-12-02 23:15:57','2025-12-02 23:15:57');
/*!40000 ALTER TABLE `station_equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trainings`
--

DROP TABLE IF EXISTS `trainings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nazwa szkolenia',
  `description` text COLLATE utf8mb4_unicode_ci,
  `duration_days` int DEFAULT NULL COMMENT 'Czas trwania szkolenia w dniach',
  `validity_months` int DEFAULT NULL COMMENT 'Okres ważności szkolenia w miesiącach',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainings`
--

LOCK TABLES `trainings` WRITE;
/*!40000 ALTER TABLE `trainings` DISABLE KEYS */;
INSERT INTO `trainings` VALUES (1,'OPZ - Ochrona Pożarnicza Zalogi','Szkolenie z zakresu ochrony pożarniczej',NULL,24,'2025-12-02 23:49:53','2025-12-02 23:49:53'),(2,'Kurs Kierowcy C','Uprawnienia do kierowania pojazdem kategorii C',NULL,60,'2025-12-02 23:49:53','2025-12-02 23:49:53'),(3,'Kurs Kierowcy D','Uprawnienia do kierowania pojazdem kategorii D',NULL,60,'2025-12-02 23:49:53','2025-12-02 23:49:53'),(4,'BHP na wypadek','Szkolenie z zakresu bezpieczeństwa i higieny pracy',NULL,12,'2025-12-02 23:49:53','2025-12-02 23:49:53'),(5,'Pierwsza Pomoc','Kurs udzielania pierwszej pomocy',NULL,24,'2025-12-02 23:49:53','2025-12-02 23:49:53'),(6,'Używanie pił łańcuchowych','Szkolenie obsługi piły łańcuchowej',NULL,24,'2025-12-02 23:49:53','2025-12-02 23:49:53'),(7,'Techniki ratownictwa techniczne','Szkolenie technik ratownictwa technicznego',NULL,24,'2025-12-02 23:49:53','2025-12-02 23:49:53'),(8,'Udzielanie pierwszej pomocy - zaawansowane','Zaawansowany kurs pierwszej pomocy',NULL,24,'2025-12-02 23:49:53','2025-12-02 23:49:53');
/*!40000 ALTER TABLE `trainings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nazwa jednostki OSP (opcjonalne)',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nazwa pojazdu (np. Auto Pożarnicze 1)',
  `operational_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Numer operacyjny pojazdu',
  `inspection_until` date DEFAULT NULL COMMENT 'Data do kiedy przegląd',
  `insurance_until` date DEFAULT NULL COMMENT 'Data do kiedy ubezpieczenie',
  `max_people` int DEFAULT NULL COMMENT 'Maksymalna liczba osób w samochodzie',
  `fire_extinguishing_agents` int DEFAULT NULL COMMENT 'Ilość środków gaśniczych',
  `water_capacity` int DEFAULT NULL COMMENT 'Pojemność wody (litry)',
  `pump_description` text COLLATE utf8mb4_unicode_ci COMMENT 'Opis autopompy',
  `total_mass` int DEFAULT NULL COMMENT 'Masa całkowita (kg)',
  `engine_power` int DEFAULT NULL COMMENT 'Moc silnika (kW)',
  `drive_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Rodzaj napędu (diesel, benzyna, hybrid)',
  `chassis_producer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Producent podwozia',
  `body_production_year` int DEFAULT NULL COMMENT 'Rok produkcji nadwozia',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Opis pojazdu',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_station_name` (`station_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES (1,NULL,'Volvo','341-76','2026-03-14','2026-03-14',6,300,4500,NULL,7560,NULL,NULL,NULL,2020,NULL,'2025-12-03 16:38:03','2025-12-03 16:38:03'),(2,NULL,'Isuzu','351-14','2025-12-25','2025-12-25',5,0,0,'Brak',2800,194,'Diesel',NULL,2023,NULL,'2025-12-11 19:30:05','2025-12-11 19:30:05');
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-13 11:40:41
