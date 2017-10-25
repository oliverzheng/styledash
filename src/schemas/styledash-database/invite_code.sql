CREATE TABLE `invite_code` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `used_timestamp` int(10) unsigned DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `assigned_waitlist_email_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `assigned_waitlist_email_id` (`assigned_waitlist_email_id`,`used_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
