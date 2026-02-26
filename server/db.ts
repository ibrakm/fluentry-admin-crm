import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertLead,
  InsertLesson,
  InsertPayment,
  InsertProgressNote,
  InsertStudent,
  InsertUser,
  leads,
  lessons,
  payments,
  progressNotes,
  students,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function getStudents(filters?: {
  search?: string;
  status?: string;
  level?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.search) {
    conditions.push(
      or(
        like(students.name, `%${filters.search}%`),
        like(students.email, `%${filters.search}%`),
        like(students.whatsapp, `%${filters.search}%`)
      )
    );
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(students.status, filters.status as any));
  }
  if (filters?.level && filters.level !== "all") {
    conditions.push(eq(students.englishLevel, filters.level as any));
  }

  const query = db.select().from(students).orderBy(desc(students.createdAt));
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0];
}

export async function createStudent(data: InsertStudent) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(students).values(data);
  const insertId = (result as any)[0]?.insertId;
  if (insertId) {
    const row = await db.select().from(students).where(eq(students.id, insertId)).limit(1);
    return row[0]!;
  }
  throw new Error("Failed to retrieve created student");
}

export async function updateStudent(id: number, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(students).set(data).where(eq(students.id, id));
}

export async function deleteStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(students).where(eq(students.id, id));
}

export async function getStudentCount() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0 };
  const total = await db.select({ count: sql<number>`count(*)` }).from(students);
  const active = await db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(eq(students.status, "active"));
  return { total: Number(total[0]?.count ?? 0), active: Number(active[0]?.count ?? 0) };
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function getPayments(studentId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(payments).orderBy(desc(payments.createdAt));
  if (studentId) return query.where(eq(payments.studentId, studentId));
  return query;
}

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(payments).values(data);
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(payments).set(data).where(eq(payments.id, id));
}

export async function deletePayment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(payments).where(eq(payments.id, id));
}

export async function getMonthlyRevenue() {
  const db = await getDb();
  if (!db) return 0;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.status, "paid"),
        gte(payments.paidAt, startOfMonth)
      )
    );
  return Number(result[0]?.total ?? 0);
}

export async function getTotalRevenue() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(eq(payments.status, "paid"));
  return Number(result[0]?.total ?? 0);
}

export async function getPaymentsByStatus() {
  const db = await getDb();
  if (!db) return { paid: 0, pending: 0, overdue: 0 };
  const result = await db
    .select({ status: payments.status, count: sql<number>`count(*)` })
    .from(payments)
    .groupBy(payments.status);
  const map: Record<string, number> = {};
  for (const row of result) map[row.status] = Number(row.count);
  return { paid: map.paid ?? 0, pending: map.pending ?? 0, overdue: map.overdue ?? 0 };
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export async function getLessons(filters?: { studentId?: number; from?: Date; to?: Date }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.studentId) conditions.push(eq(lessons.studentId, filters.studentId));
  if (filters?.from) conditions.push(gte(lessons.scheduledAt, filters.from));
  if (filters?.to) conditions.push(lte(lessons.scheduledAt, filters.to));
  const query = db.select().from(lessons).orderBy(lessons.scheduledAt);
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

export async function getUpcomingLessons(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(lessons)
    .where(and(gte(lessons.scheduledAt, new Date()), eq(lessons.status, "scheduled")))
    .orderBy(lessons.scheduledAt)
    .limit(limit);
}

export async function getLessonsNeedingReminder() {
  const db = await getDb();
  if (!db) return [];
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const in25h = new Date(Date.now() + 25 * 60 * 60 * 1000);
  return db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.status, "scheduled"),
        eq(lessons.reminderSent, false),
        gte(lessons.scheduledAt, in24h),
        lte(lessons.scheduledAt, in25h)
      )
    );
}

export async function createLesson(data: InsertLesson) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(lessons).values(data);
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(lessons).set(data).where(eq(lessons.id, id));
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(lessons).where(eq(lessons.id, id));
}

export async function getUpcomingLessonCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(lessons)
    .where(and(gte(lessons.scheduledAt, new Date()), eq(lessons.status, "scheduled")));
  return Number(result[0]?.count ?? 0);
}

// ─── Progress Notes ───────────────────────────────────────────────────────────

export async function getProgressNotes(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(progressNotes)
    .where(eq(progressNotes.studentId, studentId))
    .orderBy(desc(progressNotes.createdAt));
}

export async function createProgressNote(data: InsertProgressNote) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(progressNotes).values(data);
}

export async function updateProgressNote(id: number, data: Partial<InsertProgressNote>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(progressNotes).set(data).where(eq(progressNotes.id, id));
}

export async function deleteProgressNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(progressNotes).where(eq(progressNotes.id, id));
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function getLeads(status?: string, search?: string, id?: number) {
  const db = await getDb();
  if (!db) return id ? null : [];
  if (id) {
    const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return result[0] ?? null;
  }
  const conditions = [];
  if (status && status !== "all") conditions.push(eq(leads.status, status as any));
  if (search) {
    conditions.push(
      or(
        like(leads.name, `%${search}%`),
        like(leads.email, `%${search}%`),
        like(leads.whatsapp, `%${search}%`)
      )
    );
  }
  const query = db.select().from(leads).orderBy(desc(leads.createdAt));
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(leads).values(data);
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(leads).where(eq(leads.id, id));
}

export async function getLeadCount() {
  const db = await getDb();
  if (!db) return { total: 0, new: 0 };
  const total = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const newLeads = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(eq(leads.status, "new"));
  return { total: Number(total[0]?.count ?? 0), new: Number(newLeads[0]?.count ?? 0) };
}

// ─── Detailed Analytics ───────────────────────────────────────────────────────

export async function getLevelDistribution() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ level: students.englishLevel, count: sql<number>`count(*)` })
    .from(students)
    .groupBy(students.englishLevel);
  return result.map((r) => ({ level: r.level ?? "Unknown", count: Number(r.count) }));
}

export async function getPackageDistribution() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ package: students.packageType, count: sql<number>`count(*)` })
    .from(students)
    .groupBy(students.packageType);
  return result.map((r) => ({ package: r.package ?? "other", count: Number(r.count) }));
}

export async function getSourceDistribution() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ source: leads.source, count: sql<number>`count(*)` })
    .from(leads)
    .groupBy(leads.source);
  return result.map((r) => ({ source: r.source ?? "unknown", count: Number(r.count) }));
}

export async function getMonthlyRevenueHistory() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      month: sql<string>`DATE_FORMAT(paidAt, '%Y-%m')`,
      revenue: sql<number>`COALESCE(SUM(amount), 0)`,
    })
    .from(payments)
    .where(and(eq(payments.status, "paid"), sql`paidAt IS NOT NULL`))
    .groupBy(sql`DATE_FORMAT(paidAt, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(paidAt, '%Y-%m')`);
  return result.map((r) => ({ month: r.month, revenue: Number(r.revenue) }));
}
