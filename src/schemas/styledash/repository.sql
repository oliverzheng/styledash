CREATE TABLE `repository` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET latin1 DEFAULT NULL,
  `external_css_url` text CHARACTER SET latin1,
  `root_css` text,
  `last_updated_timestamp` int(11) NOT NULL,
  `github_username` varchar(100) DEFAULT NULL,
  `github_repo` varchar(100) DEFAULT NULL,
  `github_branch` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
