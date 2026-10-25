-- MySQL dump 10.13  Distrib 8.0.34, for macos13 (arm64)
--
-- Host: localhost    Database: mini_project
-- ------------------------------------------------------
-- Server version	8.0.34

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
-- Current Database: `mini_project`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `mini_project` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `mini_project`;

--
-- Table structure for table `Branch`
--

DROP TABLE IF EXISTS `Branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Branch` (
  `branch_id` int NOT NULL AUTO_INCREMENT,
  `branch_name` varchar(100) NOT NULL,
  `city` varchar(50) NOT NULL,
  `address` varchar(255) NOT NULL,
  `contact_number` varchar(15) NOT NULL,
  `capacity` int DEFAULT NULL,
  PRIMARY KEY (`branch_id`),
  CONSTRAINT `branch_chk_1` CHECK ((`capacity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Branch`
--

LOCK TABLES `Branch` WRITE;
/*!40000 ALTER TABLE `Branch` DISABLE KEYS */;
/*!40000 ALTER TABLE `Branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Customer`
--

DROP TABLE IF EXISTS `Customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Customer` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `license_number` varchar(30) NOT NULL,
  `license_expiry_date` date NOT NULL,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `license_number` (`license_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Customer`
--

LOCK TABLES `Customer` WRITE;
/*!40000 ALTER TABLE `Customer` DISABLE KEYS */;
/*!40000 ALTER TABLE `Customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Maintenance_Record`
--

DROP TABLE IF EXISTS `Maintenance_Record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Maintenance_Record` (
  `maintenance_id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `service_date` date NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `notes` text,
  PRIMARY KEY (`maintenance_id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `maintenance_record_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicle` (`vehicle_id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_record_chk_1` CHECK ((`cost` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Maintenance_Record`
--

LOCK TABLES `Maintenance_Record` WRITE;
/*!40000 ALTER TABLE `Maintenance_Record` DISABLE KEYS */;
/*!40000 ALTER TABLE `Maintenance_Record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Payment`
--

DROP TABLE IF EXISTS `Payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `payment_date` datetime NOT NULL,
  `payment_method` varchar(30) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_status` varchar(20) DEFAULT 'Success',
  PRIMARY KEY (`payment_id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `Rental_Booking` (`booking_id`) ON DELETE CASCADE,
  CONSTRAINT `payment_chk_1` CHECK ((`payment_method` in (_utf8mb4'Credit Card',_utf8mb4'Debit Card',_utf8mb4'UPI',_utf8mb4'Net Banking',_utf8mb4'Cash'))),
  CONSTRAINT `payment_chk_2` CHECK ((`amount_paid` > 0)),
  CONSTRAINT `payment_chk_3` CHECK ((`payment_status` in (_utf8mb4'Pending',_utf8mb4'Success',_utf8mb4'Refunded',_utf8mb4'Failed')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Payment`
--

LOCK TABLES `Payment` WRITE;
/*!40000 ALTER TABLE `Payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `Payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Rental_Booking`
--

DROP TABLE IF EXISTS `Rental_Booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Rental_Booking` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `vehicle_id` int NOT NULL,
  `pickup_branch_id` int NOT NULL,
  `dropoff_branch_id` int NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `actual_return_date` datetime DEFAULT NULL,
  `initial_mileage` int NOT NULL,
  `return_mileage` int DEFAULT NULL,
  `booking_status` varchar(20) DEFAULT 'Confirmed',
  `total_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`booking_id`),
  KEY `customer_id` (`customer_id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `pickup_branch_id` (`pickup_branch_id`),
  KEY `dropoff_branch_id` (`dropoff_branch_id`),
  CONSTRAINT `rental_booking_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`) ON DELETE CASCADE,
  CONSTRAINT `rental_booking_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicle` (`vehicle_id`) ON UPDATE CASCADE,
  CONSTRAINT `rental_booking_ibfk_3` FOREIGN KEY (`pickup_branch_id`) REFERENCES `Branch` (`branch_id`),
  CONSTRAINT `rental_booking_ibfk_4` FOREIGN KEY (`dropoff_branch_id`) REFERENCES `Branch` (`branch_id`),
  CONSTRAINT `chk_booking_dates` CHECK ((`end_date` > `start_date`)),
  CONSTRAINT `chk_mileage` CHECK (((`return_mileage` is null) or (`return_mileage` >= `initial_mileage`))),
  CONSTRAINT `rental_booking_chk_1` CHECK ((`booking_status` in (_utf8mb4'Confirmed',_utf8mb4'Ongoing',_utf8mb4'Completed',_utf8mb4'Cancelled'))),
  CONSTRAINT `rental_booking_chk_2` CHECK ((`total_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Rental_Booking`
--

LOCK TABLES `Rental_Booking` WRITE;
/*!40000 ALTER TABLE `Rental_Booking` DISABLE KEYS */;
/*!40000 ALTER TABLE `Rental_Booking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Vehicle`
--

DROP TABLE IF EXISTS `Vehicle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Vehicle` (
  `vehicle_id` int NOT NULL AUTO_INCREMENT,
  `vin` varchar(17) NOT NULL,
  `license_plate` varchar(15) NOT NULL,
  `make` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `manufacture_year` int DEFAULT NULL,
  `current_mileage` int NOT NULL DEFAULT '0',
  `status` varchar(20) DEFAULT 'Available',
  `category_id` int NOT NULL,
  `current_branch_id` int NOT NULL,
  PRIMARY KEY (`vehicle_id`),
  UNIQUE KEY `vin` (`vin`),
  UNIQUE KEY `license_plate` (`license_plate`),
  KEY `category_id` (`category_id`),
  KEY `current_branch_id` (`current_branch_id`),
  CONSTRAINT `vehicle_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `Vehicle_Category` (`category_id`) ON UPDATE CASCADE,
  CONSTRAINT `vehicle_ibfk_2` FOREIGN KEY (`current_branch_id`) REFERENCES `Branch` (`branch_id`) ON UPDATE CASCADE,
  CONSTRAINT `vehicle_chk_1` CHECK ((`manufacture_year` >= 2000)),
  CONSTRAINT `vehicle_chk_2` CHECK ((`current_mileage` >= 0)),
  CONSTRAINT `vehicle_chk_3` CHECK ((`status` in (_utf8mb4'Available',_utf8mb4'Rented',_utf8mb4'In_Maintenance',_utf8mb4'Decommissioned')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Vehicle`
--

LOCK TABLES `Vehicle` WRITE;
/*!40000 ALTER TABLE `Vehicle` DISABLE KEYS */;
/*!40000 ALTER TABLE `Vehicle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Vehicle_Category`
--

DROP TABLE IF EXISTS `Vehicle_Category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Vehicle_Category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) NOT NULL,
  `base_rate_per_day` decimal(10,2) NOT NULL,
  `late_fee_per_hour` decimal(10,2) NOT NULL,
  `security_deposit` decimal(10,2) NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_name` (`category_name`),
  CONSTRAINT `vehicle_category_chk_1` CHECK ((`base_rate_per_day` > 0)),
  CONSTRAINT `vehicle_category_chk_2` CHECK ((`late_fee_per_hour` >= 0)),
  CONSTRAINT `vehicle_category_chk_3` CHECK ((`security_deposit` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Vehicle_Category`
--

LOCK TABLES `Vehicle_Category` WRITE;
/*!40000 ALTER TABLE `Vehicle_Category` DISABLE KEYS */;
/*!40000 ALTER TABLE `Vehicle_Category` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-25 21:30:19
