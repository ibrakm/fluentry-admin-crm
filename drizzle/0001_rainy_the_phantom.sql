CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`whatsapp` varchar(30),
	`englishLevel` varchar(10),
	`goals` text,
	`motivation` varchar(100),
	`status` enum('new','contacted','converted','lost') NOT NULL DEFAULT 'new',
	`source` varchar(100) DEFAULT 'onboarding_test',
	`followUpNote` text,
	`convertedToStudentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`title` varchar(255),
	`scheduledAt` timestamp NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 60,
	`status` enum('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`meetLink` varchar(500),
	`notes` text,
	`reminderSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'MAD',
	`status` enum('paid','pending','overdue','refunded') NOT NULL DEFAULT 'pending',
	`description` varchar(255),
	`packageType` enum('starter','standard','premium','group','pay_per_lesson'),
	`lessonCount` int DEFAULT 1,
	`dueDate` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progressNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`lessonId` int,
	`levelBefore` enum('A1','A2','B1','B2','C1','C2'),
	`levelAfter` enum('A1','A2','B1','B2','C1','C2'),
	`note` text NOT NULL,
	`strengths` text,
	`areasToImprove` text,
	`homework` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `progressNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`whatsapp` varchar(30),
	`englishLevel` enum('A1','A2','B1','B2','C1','C2') DEFAULT 'A1',
	`targetLevel` enum('A1','A2','B1','B2','C1','C2') DEFAULT 'B1',
	`goals` text,
	`packageType` enum('starter','standard','premium','group','pay_per_lesson') DEFAULT 'standard',
	`status` enum('active','inactive','trial','paused') NOT NULL DEFAULT 'active',
	`notes` text,
	`source` enum('facebook_ad','referral','organic','onboarding_test','direct','other') DEFAULT 'other',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
