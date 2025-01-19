/*
localhost/weather_dashboard/		http://localhost/phpmyadmin/index.php?route=/database/sql&db=weather_dashboard
Your SQL query has been executed successfully.

SHOW CREATE TABLE feedback;
*/


feedback	CREATE TABLE `feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nickname` varchar(50) NOT NULL,
  `ease_of_use` enum('y','k','n') NOT NULL,
  `usefulness` enum('v','s','b') NOT NULL,
  `cat_annoying` enum('h','i','l') NOT NULL,
  `extra_comments` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci	

