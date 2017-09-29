CREATE TABLE `waitlist_email` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `added_timestamp` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
