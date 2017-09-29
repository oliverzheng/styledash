CREATE TABLE `example` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `component_id` bigint(20) unsigned NOT NULL,
  `code` text NOT NULL,
  `serialized_element` text,
  PRIMARY KEY (`id`),
  KEY `component_id` (`component_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
