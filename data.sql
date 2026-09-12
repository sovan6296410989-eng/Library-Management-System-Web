-- Initial Library Database Dump
-- Compatible with MySQL 8.0 & 9.4

CREATE DATABASE IF NOT EXISTS `library_db`;
USE `library_db`;

-- 1. Table structure for books
CREATE TABLE IF NOT EXISTS `books` (
  `book_id` INT NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `available` BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Table structure for members
CREATE TABLE IF NOT EXISTS `members` (
  `member_id` INT NOT NULL PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL
);

-- 3. Table structure for users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(512) NOT NULL,
  `role` VARCHAR(10) NOT NULL DEFAULT 'USER',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
);

-- 4. Table structure for issue_requests
CREATE TABLE IF NOT EXISTS `issue_requests` (
  `request_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `book_id` INT NOT NULL,
  `status` VARCHAR(10) NOT NULL DEFAULT 'PENDING',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table structure for return_requests
CREATE TABLE IF NOT EXISTS `return_requests` (
  `request_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `book_id` INT NOT NULL,
  `status` VARCHAR(10) NOT NULL DEFAULT 'PENDING',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Data for books
INSERT INTO `books` (`book_id`, `title`, `author`, `available`) VALUES
(101, 'english learning', 'john', 0),
(102, 'physics', 'ankur da', 0),
(103, 'artificial intelligence', 'rich & knight', 0),
(104, 'compiler design', 'soumen', 1),
(105, 'mathematics', 'rittick', 1),
(106, 'ai agent', 'suman', 1),
(107, 'V.A lagrasamy', 'soumik', 1),
(1037, 'Beyond the Iron Gate', 'Daniel Okafor', 1),
(1583, 'A Garden of Broken Stars', 'Thomas Pellerin', 1),
(1948, 'The Glassblower\'s Apprentice', 'Marcus Lindqvist', 1),
(2610, 'The Forgotten Lighthouse', 'Caleb Whitmore', 1),
(2740, 'The Last Cartographer', 'Owen Brightwater', 1),
(3204, 'Wolves of the Northern Pass', 'Elena Vasquez', 1),
(3725, 'The Bone Orchard', 'Nathaniel Grey', 1),
(3958, 'The Clockmaker\'s Daughter', 'Henry Vance', 1),
(4456, 'Songs for the Drowned City', 'Kwame Asante', 1),
(4821, 'The Silent Orchard', 'Maria Kensington', 1),
(5061, 'Harvest of Quiet Fields', 'Nadia Petrov', 1),
(6047, 'Letters to a Vanishing Coast', 'Aiko Sato', 1),
(6102, 'Shadows Over Calder Bay', 'Priya Natarajan', 1),
(6729, 'The Paper Lantern', 'Yuki Tanaka', 1),
(7264, 'Whispers in Amber', 'Lucia Ferreira', 1),
(7332, 'Ashes Along the Delta', 'Fatima Al-Rashid', 1),
(8391, 'Echoes of the Salt Road', 'Amara Chen', 1),
(8875, 'The Cartwright Letters', 'Simon Ashworth', 1),
(9017, 'The Midnight Ferry', 'Isabel Novak', 1),
(9483, 'Rivers That Remember', 'Sofia Moretti', 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `author`=VALUES(`author`), `available`=VALUES(`available`);

-- Data for members
INSERT INTO `members` (`member_id`, `name`) VALUES
(1, 'rittick mallick'),
(2, 'soumik khan'),
(3, 'rittick')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Data for users
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`) VALUES
(2, 'sovan', 'sovanghosh@gmail.com', '120000$uroQFkzNRrCs9mywMRFfPg==$8n8l7yqjS+RTEm3gvOxXJ+mdxdwd3ESuBsrrtSWbi0A=', 'USER'),
(6, 'Sovan Ghosh', 'sovanghosh0320@gmail.com', '120000$pavh69+5+U37mdkt3mhCKw==$IMT/a+YCQ2jGfiyP2Vo89/C1laDlyFCeqxFfpIUWqMs=', 'USER'),
(7, 'sov', 'sovan@gmail.com', '120000$jrXyGs6VQN6cCd5eIk15gg==$3uq/CQul6Ri6UTUHf7ngoLRc+aRC+zNDvBJWk/r1Hew=', 'USER'),
(8, 'Test User', 'test@example.com', '120000$EbTgg/6sR09UduwbwopAMA==$V14GJfsR9LSyKK/r/bSp7krpA9+ogEA08CPp76MsGdc=', 'USER')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `role`=VALUES(`role`);

-- Data for issue_requests
INSERT INTO `issue_requests` (`request_id`, `user_id`, `book_id`, `status`) VALUES
(1, 2, 102, 'APPROVED'),
(2, 2, 103, 'APPROVED'),
(3, 2, 101, 'APPROVED'),
(4, 2, 102, 'APPROVED'),
(5, 8, 103, 'APPROVED')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);
