import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, desc, gte, lte, like, or, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  adminUsers,
  students,
  payments,
  lessons,
  progressNotes,
  leads,
  type InsertStudent,
  type InsertPayment,
  type InsertLesson,
  type InsertProgressNote,
  type InsertLead,
} from "../drizzle/schema.sqlite";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    const client = createClient({ url, authToken });
    _db = drizzle(client);
  }
  return _db;
}

// ─── Admin Auth ───────────────────────────────────────────────────────────────

export async function initAdminUser() {
  const db = getDb();
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "fluentry2024";
  const existing = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(adminUsers).values({ username, passwordHash, createdAt: new Date() });
    console.log("[Auth] Admin user initialized");
  }
}

export async function verifyAdminLogin(username: string, password: string) {
  const db = getDb();
  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  if (result.length === 0) return null;
  const user = result[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function getStudents(filters?: { search?: string; status?: string; level?: string }) {
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
    conditions.push(eq(students.status, filters.status as any));
  }
  if (filters?.level && filters.level !== "all") {
    conditions.push(eq(students.englishLevel, filters.level as any));
  }
  if (conditions.length > 0) {
    return await db.select().from(students).where(and(...conditions)).orderBy(desc(students.createdAt));
  }
  return await db.select().from(students).orderBy(desc(students.createdAt));
}

export async function getStudentById(id: number) {
  const db = getDb();
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createStudent(data: InsertStudent) {
  const db = getDb();
  const now = new Date();
  await db.insert(students).values({ ...data, createdAt: now, updatedAt: now, enrolledAt: now });
  const result = await db.select().from(students).orderBy(desc(students.id)).limit(1);
  return result[0];
}

export async function updateStudent(id: number, data: Partial<InsertStudent>) {
  const db = getDb();
  await db.update(students).set({ ...data, updatedAt: new Date() }).where(eq(students.id, id));
  return getStudentById(id);
}

export async function deleteStudent(id: number) {
  const db = getDb();
  await db.delete(students).where(eq(students.id, id));
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function getPayments(filters?: { studentId?: number; status?: string }) {
  const db = getDb();
  const conditions = [];
  if (filters?.studentId) conditions.push(eq(payments.studentId, filters.studentId));
  if (filters?.status && filters.status !== "all") conditions.push(eq(payments.status, filters.status as any));
  if (conditions.length > 0) {
    return await db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.createdAt));
  }
  return await db.select().from(payments).orderBy(desc(payments.createdAt));
}

export async function createPayment(data: InsertPayment) {
  const db = getDb();
  const now = new Date();
  await db.insert(payments).values({ ...data, createdAt: now, updatedAt: now });
  const result = await db.select().from(payments).orderBy(desc(payments.id)).limit(1);
  return result[0];
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = getDb();
  await db.update(payments).set({ ...data, updatedAt: new Date() }).where(eq(payments.id, id));
}

export async function deletePayment(id: number) {
  const db = getDb();
  await db.delete(payments).where(eq(payments.id, id));
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export async function getLessons(filters?: { studentId?: number; status?: string; upcoming?: boolean }) {
  const db = getDb();
  const conditions = [];
  if (filters?.studentId) conditions.push(eq(lessons.studentId, filters.studentId));
  if (filters?.status && filters.status !== "all") conditions.push(eq(lessons.status, filters.status as any));
  if (filters?.upcoming) conditions.push(gte(lessons.scheduledAt, new Date()));
  if (conditions.length > 0) {
    return await db.select().from(lessons).where(and(...conditions)).orderBy(lessons.scheduledAt);
  }
  return await db.select().from(lessons).orderBy(lessons.scheduledAt);
}

export async function createLesson(data: InsertLesson) {
  const db = getDb();
  const now = new Date();
  await db.insert(lessons).values({ ...data, createdAt: now, updatedAt: now });
  const result = await db.select().from(lessons).orderBy(desc(lessons.id)).limit(1);
  return result[0];
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  const db = getDb();
  await db.update(lessons).set({ ...data, updatedAt: new Date() }).where(eq(lessons.id, id));
}

export async function deleteLesson(id: number) {
  const db = getDb();
  await db.delete(lessons).where(eq(lessons.id, id));
}

// ─── Progress Notes ───────────────────────────────────────────────────────────

export async function getProgressNotes(filters?: { studentId?: number }) {
  const db = getDb();
  if (filters?.studentId) {
    return await db.select().from(progressNotes).where(eq(progressNotes.studentId, filters.studentId)).orderBy(desc(progressNotes.createdAt));
  }
  return await db.select().from(progressNotes).orderBy(desc(progressNotes.createdAt));
}

export async function createProgressNote(data: InsertProgressNote) {
  const db = getDb();
  const now = new Date();
  await db.insert(progressNotes).values({ ...data, createdAt: now, updatedAt: now });
  const result = await db.select().from(progressNotes).orderBy(desc(progressNotes.id)).limit(1);
  return result[0];
}

export async function deleteProgressNote(id: number) {
  const db = getDb();
  await db.delete(progressNotes).where(eq(progressNotes.id, id));
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function getLeads(filters?: { search?: string; status?: string }) {
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
    conditions.push(eq(leads.status, filters.status as any));
  }
  if (conditions.length > 0) {
    return await db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt));
  }
  return await db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function createLead(data: InsertLead) {
  const db = getDb();
  const now = new Date();
  await db.insert(leads).values({ ...data, createdAt: now, updatedAt: now });
  const result = await db.select().from(leads).orderBy(desc(leads.id)).limit(1);
  return result[0];
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = getDb();
  await db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = getDb();
  await db.delete(leads).where(eq(leads.id, id));
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = getDb();
  const [allStudents, allPayments, upcomingLessons, newLeads] = await Promise.all([
    db.select().from(students),
    db.select().from(payments),
    db.select().from(lessons).where(and(eq(lessons.status, "scheduled"), gte(lessons.scheduledAt, new Date()))),
    db.select().from(leads).where(eq(leads.status, "new")),
  ]);

  const activeStudents = allStudents.filter(s => s.status === "active").length;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthlyRevenue = allPayments
    .filter(p => p.status === "paid" && p.paidAt && new Date(p.paidAt) >= monthStart)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

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
    nextLessons: lessonsWithStudents,
  };
}

export async function getAnalyticsData() {
  const db = getDb();
  const [allStudents, allPayments, allLeads] = await Promise.all([
    db.select().from(students),
    db.select().from(payments),
    db.select().from(leads),
  ]);

  // Monthly revenue for last 6 months
  const monthlyRevenue: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyRevenue[key] = 0;
  }
  allPayments.filter(p => p.status === "paid" && p.paidAt).forEach(p => {
    const d = new Date(p.paidAt!);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (key in monthlyRevenue) monthlyRevenue[key] += p.amount || 0;
  });

  // Level distribution
  const levelDist: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
  allStudents.forEach(s => { if (s.englishLevel) levelDist[s.englishLevel] = (levelDist[s.englishLevel] || 0) + 1; });

  // Package distribution
  const packageDist: Record<string, number> = {};
  allStudents.forEach(s => { if (s.packageType) packageDist[s.packageType] = (packageDist[s.packageType] || 0) + 1; });

  // Lead source distribution
  const leadSourceDist: Record<string, number> = {};
  allLeads.forEach(l => { const src = l.source || "unknown"; leadSourceDist[src] = (leadSourceDist[src] || 0) + 1; });

  // Payment status summary
  const paymentStatus = { paid: 0, pending: 0, overdue: 0, refunded: 0 };
  allPayments.forEach(p => { if (p.status in paymentStatus) paymentStatus[p.status as keyof typeof paymentStatus]++; });

  return {
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
    levelDistribution: Object.entries(levelDist).map(([level, count]) => ({ level, count })),
    packageDistribution: Object.entries(packageDist).map(([pkg, count]) => ({ package: pkg, count })),
    leadSourceDistribution: Object.entries(leadSourceDist).map(([source, count]) => ({ source, count })),
    paymentStatus,
  };
}

// ─── DB Init ─────────────────────────────────────────────────────────────────

export async function initDatabase() {
  const db = getDb();
  // Create tables if they don't exist (Turso supports CREATE TABLE IF NOT EXISTS)
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
