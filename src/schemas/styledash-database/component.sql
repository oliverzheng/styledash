CREATE TABLE `component` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `repository_id` bigint(20) unsigned NOT NULL,
  `filepath` varchar(256) NOT NULL,
  `compiled_bundle` longtext NOT NULL,
  `react_doc` longtext NOT NULL,
  `override_react_doc` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `repository_path` (`repository_id`,`filepath`),
  KEY `repository_id` (`repository_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
