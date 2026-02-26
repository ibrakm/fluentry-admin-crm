// server/vercel-handler.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers-vercel.ts
import { z } from "zod";

// shared/const.ts
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/routers-vercel.ts
import { TRPCError as TRPCError2 } from "@trpc/server";

// server/db-turso.ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, desc, gte, like, or, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// drizzle/schema.sqlite.ts
import { text, sqliteTable, integer, real } from "drizzle-orm/sqlite-core";
var adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var students = sqliteTable("students", {
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
  enrolledAt: integer("enrolledAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var payments = sqliteTable("payments", {
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
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  title: text("title"),
  scheduledAt: integer("scheduledAt", { mode: "timestamp_ms" }).notNull(),
  durationMinutes: integer("durationMinutes").default(60).notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled", "no_show"] }).default("scheduled").notNull(),
  meetLink: text("meetLink"),
  notes: text("notes"),
  reminderSent: integer("reminderSent", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var progressNotes = sqliteTable("progressNotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  lessonId: integer("lessonId"),
  levelBefore: text("levelBefore", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }),
  levelAfter: text("levelAfter", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }),
  note: text("note").notNull(),
  strengths: text("strengths"),
  areasToImprove: text("areasToImprove"),
  homework: text("homework"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var leads = sqliteTable("leads", {
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
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});

// server/db-turso.ts
var _db = null;
function getDb() {
  if (!_db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    const client = createClient({ url, authToken });
    _db = drizzle(client);
  }
  return _db;
}
async function initAdminUser() {
  const db = getDb();
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "fluentry2024";
  const existing = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(adminUsers).values({ username, passwordHash, createdAt: /* @__PURE__ */ new Date() });
    console.log("[Auth] Admin user initialized");
  }
}
async function verifyAdminLogin(username, password) {
  const db = getDb();
  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  if (result.length === 0) return null;
  const user = result[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}
async function getStudents(filters) {
  const db = getDb();
  let query = db.select().from(students);
  const conditions = [];
  if (filters?.search) {
    conditions.push(
      or(
        like(students.name, `%${filters.search}%`),
        like(students.email ?? "", `%${filters.search}%`),
        like(students.whatsapp ?? "", `%${filters.search}%`)
      )
    );
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(students.status, filters.status));
  }
  if (filters?.level && filters.level !== "all") {
    conditions.push(eq(students.englishLevel, filters.level));
  }
  if (conditions.length > 0) {
    return await db.select().from(students).where(and(...conditions)).orderBy(desc(students.createdAt));
  }
  return await db.select().from(students).orderBy(desc(students.createdAt));
}
async function getStudentById(id) {
  const db = getDb();
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0] ?? null;
}
async function createStudent(data) {
  const db = getDb();
  const now = /* @__PURE__ */ new Date();
  await db.insert(students).values({ ...data, createdAt: now, updatedAt: now, enrolledAt: now });
  const result = await db.select().from(students).orderBy(desc(students.id)).limit(1);
  return result[0];
}
async function updateStudent(id, data) {
  const db = getDb();
  await db.update(students).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(students.id, id));
  return getStudentById(id);
}
async function deleteStudent(id) {
  const db = getDb();
  await db.delete(students).where(eq(students.id, id));
}
async function getPayments(filters) {
  const db = getDb();
  const conditions = [];
  if (filters?.studentId) conditions.push(eq(payments.studentId, filters.studentId));
  if (filters?.status && filters.status !== "all") conditions.push(eq(payments.status, filters.status));
  if (conditions.length > 0) {
    return await db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.createdAt));
  }
  return await db.select().from(payments).orderBy(desc(payments.createdAt));
}
async function createPayment(data) {
  const db = getDb();
  const now = /* @__PURE__ */ new Date();
  await db.insert(payments).values({ ...data, createdAt: now, updatedAt: now });
  const result = await db.select().from(payments).orderBy(desc(payments.id)).limit(1);
  return result[0];
}
async function updatePayment(id, data) {
  const db = getDb();
  await db.update(payments).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(payments.id, id));
}
async function deletePayment(id) {
  const db = getDb();
  await db.delete(payments).where(eq(payments.id, id));
}
async function getLessons(filters) {
  const db = getDb();
  const conditions = [];
  if (filters?.studentId) conditions.push(eq(lessons.studentId, filters.studentId));
  if (filters?.status && filters.status !== "all") conditions.push(eq(lessons.status, filters.status));
  if (filters?.upcoming) conditions.push(gte(lessons.scheduledAt, /* @__PURE__ */ new Date()));
  if (conditions.length > 0) {
    return await db.select().from(lessons).where(and(...conditions)).orderBy(lessons.scheduledAt);
  }
  return await db.select().from(lessons).orderBy(lessons.scheduledAt);
}
async function createLesson(data) {
  const db = getDb();
  const now = /* @__PURE__ */ new Date();
  await db.insert(lessons).values({ ...data, createdAt: now, updatedAt: now });
  const result = await db.select().from(lessons).orderBy(desc(lessons.id)).limit(1);
  return result[0];
}
async function updateLesson(id, data) {
  const db = getDb();
  await db.update(lessons).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(lessons.id, id));
}
async function deleteLesson(id) {
  const db = getDb();
  await db.delete(lessons).where(eq(lessons.id, id));
}
async function getProgressNotes(filters) {
  const db = getDb();
  if (filters?.studentId) {
    return await db.select().from(progressNotes).where(eq(progressNotes.studentId, filters.studentId)).orderBy(desc(progressNotes.createdAt));
  }
  return await db.select().from(progressNotes).orderBy(desc(progressNotes.createdAt));
}
async function createProgressNote(data) {
  const db = getDb();
  const now = /* @__PURE__ */ new Date();
  await db.insert(progressNotes).values({ ...data, createdAt: now, updatedAt: now });
  const result = await db.select().from(progressNotes).orderBy(desc(progressNotes.id)).limit(1);
  return result[0];
}
async function deleteProgressNote(id) {
  const db = getDb();
  await db.delete(progressNotes).where(eq(progressNotes.id, id));
}
async function getLeads(filters) {
  const db = getDb();
  const conditions = [];
  if (filters?.search) {
    conditions.push(
      or(
        like(leads.name ?? "", `%${filters.search}%`),
        like(leads.email ?? "", `%${filters.search}%`)
      )
    );
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(leads.status, filters.status));
  }
  if (conditions.length > 0) {
    return await db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt));
  }
  return await db.select().from(leads).orderBy(desc(leads.createdAt));
}
async function createLead(data) {
  const db = getDb();
  const now = /* @__PURE__ */ new Date();
  await db.insert(leads).values({ ...data, createdAt: now, updatedAt: now });
  const result = await db.select().from(leads).orderBy(desc(leads.id)).limit(1);
  return result[0];
}
async function updateLead(id, data) {
  const db = getDb();
  await db.update(leads).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(leads.id, id));
}
async function deleteLead(id) {
  const db = getDb();
  await db.delete(leads).where(eq(leads.id, id));
}
async function getDashboardStats() {
  const db = getDb();
  const [allStudents, allPayments, upcomingLessons, newLeads] = await Promise.all([
    db.select().from(students),
    db.select().from(payments),
    db.select().from(lessons).where(and(eq(lessons.status, "scheduled"), gte(lessons.scheduledAt, /* @__PURE__ */ new Date()))),
    db.select().from(leads).where(eq(leads.status, "new"))
  ]);
  const activeStudents = allStudents.filter((s) => s.status === "active").length;
  const monthStart = /* @__PURE__ */ new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthlyRevenue = allPayments.filter((p) => p.status === "paid" && p.paidAt && new Date(p.paidAt) >= monthStart).reduce((sum, p) => sum + (p.amount || 0), 0);
  const nextLessons = upcomingLessons.slice(0, 5);
  const lessonsWithStudents = await Promise.all(
    nextLessons.map(async (lesson) => {
      const student = await getStudentById(lesson.studentId);
      return { ...lesson, studentName: student?.name ?? "Unknown" };
    })
  );
  return {
    totalStudents: allStudents.length,
    activeStudents,
    monthlyRevenue,
    upcomingLessonsCount: upcomingLessons.length,
    newLeadsCount: newLeads.length,
    nextLessons: lessonsWithStudents
  };
}
async function getAnalyticsData() {
  const db = getDb();
  const [allStudents, allPayments, allLeads] = await Promise.all([
    db.select().from(students),
    db.select().from(payments),
    db.select().from(leads)
  ]);
  const monthlyRevenue = {};
  for (let i = 5; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyRevenue[key] = 0;
  }
  allPayments.filter((p) => p.status === "paid" && p.paidAt).forEach((p) => {
    const d = new Date(p.paidAt);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (key in monthlyRevenue) monthlyRevenue[key] += p.amount || 0;
  });
  const levelDist = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
  allStudents.forEach((s) => {
    if (s.englishLevel) levelDist[s.englishLevel] = (levelDist[s.englishLevel] || 0) + 1;
  });
  const packageDist = {};
  allStudents.forEach((s) => {
    if (s.packageType) packageDist[s.packageType] = (packageDist[s.packageType] || 0) + 1;
  });
  const leadSourceDist = {};
  allLeads.forEach((l) => {
    const src = l.source || "unknown";
    leadSourceDist[src] = (leadSourceDist[src] || 0) + 1;
  });
  const paymentStatus = { paid: 0, pending: 0, overdue: 0, refunded: 0 };
  allPayments.forEach((p) => {
    if (p.status in paymentStatus) paymentStatus[p.status]++;
  });
  return {
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
    levelDistribution: Object.entries(levelDist).map(([level, count]) => ({ level, count })),
    packageDistribution: Object.entries(packageDist).map(([pkg, count]) => ({ package: pkg, count })),
    leadSourceDistribution: Object.entries(leadSourceDist).map(([source, count]) => ({ source, count })),
    paymentStatus
  };
}
async function initDatabase() {
  const db = getDb();
  await db.run(sql`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    englishLevel TEXT DEFAULT 'A1',
    targetLevel TEXT DEFAULT 'B1',
    goals TEXT,
    packageType TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'active' NOT NULL,
    notes TEXT,
    source TEXT DEFAULT 'other',
    enrolledAt INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'MAD' NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    description TEXT,
    packageType TEXT,
    lessonCount INTEGER DEFAULT 1,
    dueDate INTEGER,
    paidAt INTEGER,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    title TEXT,
    scheduledAt INTEGER NOT NULL,
    durationMinutes INTEGER DEFAULT 60 NOT NULL,
    status TEXT DEFAULT 'scheduled' NOT NULL,
    meetLink TEXT,
    notes TEXT,
    reminderSent INTEGER DEFAULT 0 NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS progressNotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    lessonId INTEGER,
    levelBefore TEXT,
    levelAfter TEXT,
    note TEXT NOT NULL,
    strengths TEXT,
    areasToImprove TEXT,
    homework TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    whatsapp TEXT,
    englishLevel TEXT,
    goals TEXT,
    motivation TEXT,
    status TEXT DEFAULT 'new' NOT NULL,
    source TEXT DEFAULT 'onboarding_test',
    testScore TEXT,
    followUpNote TEXT,
    convertedToStudentId INTEGER,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);
  await initAdminUser();
  console.log("[DB] Database initialized");
}

// server/routers-vercel.ts
import { SignJWT, jwtVerify } from "jose";
var JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fluentry-secret-key-change-in-production");
var authRouter = router({
  login: publicProcedure.input(z.object({ username: z.string(), password: z.string() })).mutation(async ({ input, ctx }) => {
    const user = await verifyAdminLogin(input.username, input.password);
    if (!user) throw new TRPCError2({ code: "UNAUTHORIZED", message: "Invalid credentials" });
    const token = await new SignJWT({ userId: user.id, username: user.username }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(JWT_SECRET);
    ctx.res.setHeader("Set-Cookie", `admin_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return { success: true, username: user.username };
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", "admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
    return { success: true };
  }),
  me: publicProcedure.query(async ({ ctx }) => {
    const cookieHeader = ctx.req.headers.cookie || "";
    const tokenMatch = cookieHeader.match(/admin_token=([^;]+)/);
    if (!tokenMatch) return null;
    try {
      const { payload } = await jwtVerify(tokenMatch[1], JWT_SECRET);
      return { username: payload.username };
    } catch {
      return null;
    }
  })
});
var studentsRouter = router({
  list: publicProcedure.input(z.object({ search: z.string().optional(), status: z.string().optional(), level: z.string().optional() }).optional()).query(async ({ input }) => getStudents(input)),
  get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const student = await getStudentById(input.id);
    if (!student) throw new TRPCError2({ code: "NOT_FOUND" });
    return student;
  }),
  create: publicProcedure.input(z.object({
    name: z.string().min(1),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    englishLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
    targetLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
    goals: z.string().optional(),
    packageType: z.enum(["starter", "standard", "premium", "group", "pay_per_lesson"]).optional(),
    status: z.enum(["active", "inactive", "trial", "paused"]).optional(),
    notes: z.string().optional(),
    source: z.enum(["facebook_ad", "referral", "organic", "onboarding_test", "direct", "other"]).optional()
  })).mutation(async ({ input }) => createStudent(input)),
  update: publicProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    englishLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
    targetLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
    goals: z.string().optional(),
    packageType: z.enum(["starter", "standard", "premium", "group", "pay_per_lesson"]).optional(),
    status: z.enum(["active", "inactive", "trial", "paused"]).optional(),
    notes: z.string().optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return updateStudent(id, data);
  }),
  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => deleteStudent(input.id))
});
var paymentsRouter = router({
  list: publicProcedure.input(z.object({ studentId: z.number().optional(), status: z.string().optional() }).optional()).query(async ({ input }) => getPayments(input)),
  create: publicProcedure.input(z.object({
    studentId: z.number(),
    amount: z.number(),
    currency: z.string().optional(),
    status: z.enum(["paid", "pending", "overdue", "refunded"]).optional(),
    description: z.string().optional(),
    packageType: z.enum(["starter", "standard", "premium", "group", "pay_per_lesson"]).optional(),
    lessonCount: z.number().optional(),
    dueDate: z.date().optional(),
    paidAt: z.date().optional()
  })).mutation(async ({ input }) => createPayment(input)),
  update: publicProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["paid", "pending", "overdue", "refunded"]).optional(),
    amount: z.number().optional(),
    paidAt: z.date().optional(),
    description: z.string().optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return updatePayment(id, data);
  }),
  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => deletePayment(input.id))
});
var lessonsRouter = router({
  list: publicProcedure.input(z.object({ studentId: z.number().optional(), status: z.string().optional(), upcoming: z.boolean().optional() }).optional()).query(async ({ input }) => getLessons(input)),
  create: publicProcedure.input(z.object({
    studentId: z.number(),
    title: z.string().optional(),
    scheduledAt: z.date(),
    durationMinutes: z.number().optional(),
    status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
    meetLink: z.string().optional(),
    notes: z.string().optional()
  })).mutation(async ({ input }) => createLesson(input)),
  update: publicProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
    scheduledAt: z.date().optional(),
    meetLink: z.string().optional(),
    notes: z.string().optional(),
    reminderSent: z.boolean().optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return updateLesson(id, data);
  }),
  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => deleteLesson(input.id))
});
var progressRouter = router({
  list: publicProcedure.input(z.object({ studentId: z.number().optional() }).optional()).query(async ({ input }) => getProgressNotes(input)),
  create: publicProcedure.input(z.object({
    studentId: z.number(),
    lessonId: z.number().optional(),
    levelBefore: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
    levelAfter: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
    note: z.string().min(1),
    strengths: z.string().optional(),
    areasToImprove: z.string().optional(),
    homework: z.string().optional()
  })).mutation(async ({ input }) => createProgressNote(input)),
  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => deleteProgressNote(input.id))
});
var leadsRouter = router({
  list: publicProcedure.input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional()).query(async ({ input }) => getLeads(input)),
  create: publicProcedure.input(z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    englishLevel: z.string().optional(),
    goals: z.string().optional(),
    motivation: z.string().optional(),
    source: z.string().optional(),
    testScore: z.string().optional()
  })).mutation(async ({ input }) => createLead(input)),
  update: publicProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["new", "contacted", "interested", "converted", "lost"]).optional(),
    followUpNote: z.string().optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return updateLead(id, data);
  }),
  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => deleteLead(input.id)),
  convertToStudent: publicProcedure.input(z.object({ leadId: z.number() })).mutation(async ({ input }) => {
    const allLeads = await getLeads();
    const lead = allLeads.find((l) => l.id === input.leadId);
    if (!lead) throw new TRPCError2({ code: "NOT_FOUND" });
    const student = await createStudent({
      name: lead.name || "Unknown",
      email: lead.email ?? void 0,
      whatsapp: lead.whatsapp ?? void 0,
      englishLevel: lead.englishLevel || "A1",
      goals: lead.goals ?? void 0,
      source: "onboarding_test",
      status: "active"
    });
    await updateLead(input.leadId, { status: "converted", convertedToStudentId: student?.id });
    return student;
  })
});
var analyticsRouter = router({
  dashboard: publicProcedure.query(() => getDashboardStats()),
  detailed: publicProcedure.query(() => getAnalyticsData())
});
var publicRouter = router({
  submitLead: publicProcedure.input(z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    englishLevel: z.string().optional(),
    goals: z.string().optional(),
    motivation: z.string().optional(),
    testScore: z.string().optional(),
    source: z.string().optional()
  })).mutation(async ({ input }) => {
    await createLead({ ...input, status: "new", source: input.source || "website" });
    return { success: true };
  })
});
var appRouterVercel = router({
  auth: authRouter,
  students: studentsRouter,
  payments: paymentsRouter,
  lessons: lessonsRouter,
  progress: progressRouter,
  leads: leadsRouter,
  analytics: analyticsRouter,
  public: publicRouter
});

// server/vercel-handler.ts
async function createVercelContext(opts) {
  return {
    req: opts.req,
    res: opts.res,
    user: null
    // Vercel router uses its own cookie-based JWT auth
  };
}
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
var dbInitialized = false;
app.use(async (_req, _res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (err) {
      console.error("[DB] Init failed:", err);
    }
  }
  next();
});
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouterVercel,
    createContext: createVercelContext
  })
);
var vercel_handler_default = app;
export {
  vercel_handler_default as default
};
