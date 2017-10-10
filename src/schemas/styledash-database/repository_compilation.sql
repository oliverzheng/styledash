CREATE TABLE `repository_compilation` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `repository_id` bigint(20) unsigned NOT NULL,
  `commit_hash` char(50) NOT NULL,
  `compiled_bundle` longtext NOT NULL,
  `added_timestamp` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `repository_id` (`repository_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
