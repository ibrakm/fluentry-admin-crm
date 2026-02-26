import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Students table
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  englishLevel: mysqlEnum("englishLevel", ["A1", "A2", "B1", "B2", "C1", "C2"]).default("A1"),
  targetLevel: mysqlEnum("targetLevel", ["A1", "A2", "B1", "B2", "C1", "C2"]).default("B1"),
  goals: text("goals"),
  packageType: mysqlEnum("packageType", ["starter", "standard", "premium", "group", "pay_per_lesson"]).default("standard"),
  status: mysqlEnum("status", ["active", "inactive", "trial", "paused"]).default("active").notNull(),
  notes: text("notes"),
  source: mysqlEnum("source", ["facebook_ad", "referral", "organic", "onboarding_test", "direct", "other"]).default("other"),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// Payments table
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("MAD").notNull(),
  status: mysqlEnum("status", ["paid", "pending", "overdue", "refunded"]).default("pending").notNull(),
  description: varchar("description", { length: 255 }),
  packageType: mysqlEnum("packageType", ["starter", "standard", "premium", "group", "pay_per_lesson"]),
  lessonCount: int("lessonCount").default(1),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Lessons table
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  title: varchar("title", { length: 255 }),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMinutes: int("durationMinutes").default(60).notNull(),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  meetLink: varchar("meetLink", { length: 500 }),
  notes: text("notes"),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

// Progress notes table
export const progressNotes = mysqlTable("progressNotes", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  lessonId: int("lessonId"),
  levelBefore: mysqlEnum("levelBefore", ["A1", "A2", "B1", "B2", "C1", "C2"]),
  levelAfter: mysqlEnum("levelAfter", ["A1", "A2", "B1", "B2", "C1", "C2"]),
  note: text("note").notNull(),
  strengths: text("strengths"),
  areasToImprove: text("areasToImprove"),
  homework: text("homework"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProgressNote = typeof progressNotes.$inferSelect;
export type InsertProgressNote = typeof progressNotes.$inferInsert;

// Leads table (from onboarding test submissions)
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  englishLevel: varchar("englishLevel", { length: 10 }),
  goals: text("goals"),
  motivation: varchar("motivation", { length: 100 }),
  status: mysqlEnum("status", ["new", "contacted", "interested", "converted", "lost"]).default("new").notNull(),
  source: varchar("source", { length: 100 }).default("onboarding_test"),
  testScore: varchar("testScore", { length: 50 }),
  followUpNote: text("followUpNote"),
  convertedToStudentId: int("convertedToStudentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
