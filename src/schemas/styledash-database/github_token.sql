CREATE TABLE `github_token` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `repository_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `github_user` varchar(100) NOT NULL,
  `token` varchar(100) NOT NULL,
  `scopes` text,
  `added_timestamp` int(11) NOT NULL,
  `modified_timestamp` int(11) NOT NULL,
  `last_used_timestamp` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `repository_id` (`repository_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
