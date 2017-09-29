CREATE TABLE `component` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `repository_id` bigint(20) unsigned DEFAULT NULL,
  `filepath` mediumtext NOT NULL,
  `compiled_bundle` longtext NOT NULL,
  `react_doc` longtext NOT NULL,
  `override_react_doc` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `repository_id` (`repository_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
