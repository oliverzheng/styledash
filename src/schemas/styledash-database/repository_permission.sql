CREATE TABLE `repository_permission` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `repository_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `permission` enum('read_write','admin') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `perm_check` (`repository_id`,`user_id`,`permission`),
  UNIQUE KEY `perm_user_search` (`repository_id`,`user_id`),
  KEY `repository_id` (`repository_id`),
  KEY `user_id` (`user_id`),
  KEY `perm_type_search` (`repository_id`,`permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
