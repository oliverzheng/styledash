CREATE TABLE `github_repository_token` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `github_repo_id` int(11) NOT NULL,
  `github_token_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `github_repo_id` (`github_repo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
