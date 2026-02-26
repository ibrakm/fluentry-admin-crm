import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db-turso";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fluentry-secret-key-change-in-production");

// ─── Auth Router ─────────────────────────────────────────────────────────────

const authRouter = router({
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.verifyAdminLogin(input.username, input.password);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const token = await new SignJWT({ userId: user.id, username: user.username })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(JWT_SECRET);
      // Set cookie
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
      return { username: payload.username as string };
    } catch {
      return null;
    }
  }),
});

// ─── Students Router ──────────────────────────────────────────────────────────

const studentsRouter = router({
  list: publicProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional(), level: z.string().optional() }).optional())
    .query(async ({ input }) => db.getStudents(input)),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const student = await db.getStudentById(input.id);
      if (!student) throw new TRPCError({ code: "NOT_FOUND" });
      return student;
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().optional(),
      whatsapp: z.string().optional(),
      englishLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
      targetLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
      goals: z.string().optional(),
      packageType: z.enum(["starter", "standard", "premium", "group", "pay_per_lesson"]).optional(),
      status: z.enum(["active", "inactive", "trial", "paused"]).optional(),
      notes: z.string().optional(),
      source: z.enum(["facebook_ad", "referral", "organic", "onboarding_test", "direct", "other"]).optional(),
    }))
    .mutation(async ({ input }) => db.createStudent(input as any)),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      email: z.string().optional(),
      whatsapp: z.string().optional(),
      englishLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
      targetLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
      goals: z.string().optional(),
      packageType: z.enum(["starter", "standard", "premium", "group", "pay_per_lesson"]).optional(),
      status: z.enum(["active", "inactive", "trial", "paused"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateStudent(id, data as any);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.deleteStudent(input.id)),
});

// ─── Payments Router ──────────────────────────────────────────────────────────

const paymentsRouter = router({
  list: publicProcedure
    .input(z.object({ studentId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => db.getPayments(input)),

  create: publicProcedure
    .input(z.object({
      studentId: z.number(),
      amount: z.number(),
      currency: z.string().optional(),
      status: z.enum(["paid", "pending", "overdue", "refunded"]).optional(),
      description: z.string().optional(),
      packageType: z.enum(["starter", "standard", "premium", "group", "pay_per_lesson"]).optional(),
      lessonCount: z.number().optional(),
      dueDate: z.date().optional(),
      paidAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => db.createPayment(input as any)),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["paid", "pending", "overdue", "refunded"]).optional(),
      amount: z.number().optional(),
      paidAt: z.date().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updatePayment(id, data as any);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.deletePayment(input.id)),
});

// ─── Lessons Router ───────────────────────────────────────────────────────────

const lessonsRouter = router({
  list: publicProcedure
    .input(z.object({ studentId: z.number().optional(), status: z.string().optional(), upcoming: z.boolean().optional() }).optional())
    .query(async ({ input }) => db.getLessons(input)),

  create: publicProcedure
    .input(z.object({
      studentId: z.number(),
      title: z.string().optional(),
      scheduledAt: z.date(),
      durationMinutes: z.number().optional(),
      status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
      meetLink: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => db.createLesson(input as any)),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
      scheduledAt: z.date().optional(),
      meetLink: z.string().optional(),
      notes: z.string().optional(),
      reminderSent: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateLesson(id, data as any);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.deleteLesson(input.id)),
});

// ─── Progress Router ──────────────────────────────────────────────────────────

const progressRouter = router({
  list: publicProcedure
    .input(z.object({ studentId: z.number().optional() }).optional())
    .query(async ({ input }) => db.getProgressNotes(input)),

  create: publicProcedure
    .input(z.object({
      studentId: z.number(),
      lessonId: z.number().optional(),
      levelBefore: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
      levelAfter: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
      note: z.string().min(1),
      strengths: z.string().optional(),
      areasToImprove: z.string().optional(),
      homework: z.string().optional(),
    }))
    .mutation(async ({ input }) => db.createProgressNote(input as any)),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.deleteProgressNote(input.id)),
});

// ─── Leads Router ─────────────────────────────────────────────────────────────

const leadsRouter = router({
  list: publicProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => db.getLeads(input)),

  create: publicProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      whatsapp: z.string().optional(),
      englishLevel: z.string().optional(),
      goals: z.string().optional(),
      motivation: z.string().optional(),
      source: z.string().optional(),
      testScore: z.string().optional(),
    }))
    .mutation(async ({ input }) => db.createLead(input as any)),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "interested", "converted", "lost"]).optional(),
      followUpNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateLead(id, data as any);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.deleteLead(input.id)),

  convertToStudent: publicProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
      const allLeads = await db.getLeads();
      const lead = allLeads.find(l => l.id === input.leadId);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      const student = await db.createStudent({
        name: lead.name || "Unknown",
        email: lead.email ?? undefined,
        whatsapp: lead.whatsapp ?? undefined,
        englishLevel: (lead.englishLevel as any) || "A1",
        goals: lead.goals ?? undefined,
        source: "onboarding_test",
        status: "active",
      });
      await db.updateLead(input.leadId, { status: "converted", convertedToStudentId: student?.id });
      return student;
    }),
});

// ─── Analytics Router ─────────────────────────────────────────────────────────

const analyticsRouter = router({
  dashboard: publicProcedure.query(() => db.getDashboardStats()),
  detailed: publicProcedure.query(() => db.getAnalyticsData()),
});

// ─── Public Leads Submission (from website) ───────────────────────────────────

const publicRouter = router({
  submitLead: publicProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      whatsapp: z.string().optional(),
      englishLevel: z.string().optional(),
      goals: z.string().optional(),
      motivation: z.string().optional(),
      testScore: z.string().optional(),
      source: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createLead({ ...input, status: "new", source: input.source || "website" });
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouterVercel = router({
  auth: authRouter,
  students: studentsRouter,
  payments: paymentsRouter,
  lessons: lessonsRouter,
  progress: progressRouter,
  leads: leadsRouter,
  analytics: analyticsRouter,
  public: publicRouter,
});

export type AppRouterVercel = typeof appRouterVercel;
