import { int, text, sqliteTable, integer, real } from "drizzle-orm/sqlite-core";

// Admin user table (simple username/password auth for Vercel deployment)
export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

// Students table
export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  englishLevel: text("englishLevel", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }).default("A1"),
  targetLevel: text("targetLevel", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }).default("B1"),
  goals: text("goals"),
  packageType: text("packageType", { enum: ["starter", "standard", "premium", "group", "pay_per_lesson"] }).default("standard"),
  status: text("status", { enum: ["active", "inactive", "trial", "paused"] }).default("active").notNull(),
  notes: text("notes"),
  source: text("source", { enum: ["facebook_ad", "referral", "organic", "onboarding_test", "direct", "other"] }).default("other"),
  enrolledAt: integer("enrolledAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// Payments table
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").default("MAD").notNull(),
  status: text("status", { enum: ["paid", "pending", "overdue", "refunded"] }).default("pending").notNull(),
  description: text("description"),
  packageType: text("packageType", { enum: ["starter", "standard", "premium", "group", "pay_per_lesson"] }),
  lessonCount: integer("lessonCount").default(1),
  dueDate: integer("dueDate", { mode: "timestamp_ms" }),
  paidAt: integer("paidAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Lessons table
export const lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  title: text("title"),
  scheduledAt: integer("scheduledAt", { mode: "timestamp_ms" }).notNull(),
  durationMinutes: integer("durationMinutes").default(60).notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled", "no_show"] }).default("scheduled").notNull(),
  meetLink: text("meetLink"),
  notes: text("notes"),
  reminderSent: integer("reminderSent", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

// Progress notes table
export const progressNotes = sqliteTable("progressNotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  lessonId: integer("lessonId"),
  levelBefore: text("levelBefore", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }),
  levelAfter: text("levelAfter", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }),
  note: text("note").notNull(),
  strengths: text("strengths"),
  areasToImprove: text("areasToImprove"),
  homework: text("homework"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type ProgressNote = typeof progressNotes.$inferSelect;
export type InsertProgressNote = typeof progressNotes.$inferInsert;

// Leads table
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  englishLevel: text("englishLevel"),
  goals: text("goals"),
  motivation: text("motivation"),
  status: text("status", { enum: ["new", "contacted", "interested", "converted", "lost"] }).default("new").notNull(),
  source: text("source").default("onboarding_test"),
  testScore: text("testScore"),
  followUpNote: text("followUpNote"),
  convertedToStudentId: integer("convertedToStudentId"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
