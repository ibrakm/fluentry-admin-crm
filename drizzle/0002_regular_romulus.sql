ALTER TABLE `leads` MODIFY COLUMN `status` enum('new','contacted','interested','converted','lost') NOT NULL DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `leads` ADD `testScore` varchar(50);