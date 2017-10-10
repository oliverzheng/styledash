CREATE TABLE `component` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `repository_id` bigint(20) unsigned NOT NULL,
  `filepath` varchar(256) NOT NULL,
  `is_named_export` tinyint(1) NOT NULL DEFAULT '0',
  `compiled_bundle` longtext,
  `react_doc` longtext NOT NULL,
  `override_react_doc` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `repository_path` (`name`,`repository_id`,`filepath`,`is_named_export`),
  KEY `repository_id` (`repository_id`,`is_named_export`),
  KEY `repository_id_2` (`repository_id`,`filepath`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
