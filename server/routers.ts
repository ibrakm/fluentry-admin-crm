import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createLead,
  createLesson,
  createPayment,
  createProgressNote,
  createStudent,
  deleteLead,
  deleteLesson,
  deletePayment,
  deleteProgressNote,
  deleteStudent,
  getLeadCount,
  getLeads,
  getLessons,
  getLevelDistribution,
  getMonthlyRevenue,
  getMonthlyRevenueHistory,
  getPackageDistribution,
  getPayments,
  getPaymentsByStatus,
  getProgressNotes,
  getSourceDistribution,
  getStudentById,
  getStudentCount,
  getStudents,
  getTotalRevenue,
  getUpcomingLessonCount,
  getUpcomingLessons,
  updateLead,
  updateLesson,
  updatePayment,
  updateProgressNote,
  updateStudent,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const englishLevel = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
const packageType = z.enum(["starter", "standard", "premium", "group", "pay_per_lesson"]);
const studentStatus = z.enum(["active", "inactive", "trial", "paused"]);
const paymentStatus = z.enum(["paid", "pending", "overdue", "refunded"]);
const lessonStatus = z.enum(["scheduled", "completed", "cancelled", "no_show"]);
const leadStatus = z.enum(["new", "contacted", "interested", "converted", "lost"]);

const studentInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  englishLevel: englishLevel.optional(),
  targetLevel: englishLevel.optional(),
  goals: z.string().optional(),
  packageType: packageType.optional(),
  status: studentStatus.optional(),
  notes: z.string().optional(),
  source: z.enum(["facebook_ad", "referral", "organic", "onboarding_test", "direct", "other"]).optional(),
});

const paymentInput = z.object({
  studentId: z.number(),
  amount: z.string(),
  currency: z.string().default("MAD"),
  status: paymentStatus.optional(),
  description: z.string().optional(),
  packageType: packageType.optional(),
  lessonCount: z.number().optional(),
  dueDate: z.date().optional(),
  paidAt: z.date().optional(),
});

const lessonInput = z.object({
  studentId: z.number(),
  title: z.string().optional(),
  scheduledAt: z.date(),
  durationMinutes: z.number().default(60),
  status: lessonStatus.optional(),
  meetLink: z.string().optional(),
  notes: z.string().optional(),
});

const progressNoteInput = z.object({
  studentId: z.number(),
  lessonId: z.number().optional(),
  levelBefore: englishLevel.optional(),
  levelAfter: englishLevel.optional(),
  note: z.string().min(1),
  strengths: z.string().optional(),
  areasToImprove: z.string().optional(),
  homework: z.string().optional(),
});

const leadInput = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  englishLevel: z.string().optional(),
  goals: z.string().optional(),
  motivation: z.string().optional(),
  status: leadStatus.optional(),
  source: z.string().optional(),
  testScore: z.string().optional(),
  followUpNote: z.string().optional(),
  convertedToStudentId: z.number().optional(),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Analytics ─────────────────────────────────────────────────────────────
  analytics: router({
    detailed: adminProcedure.query(async () => {
      const [levelDistribution, packageDistribution, sourceDistribution, monthlyRevenue] = await Promise.all([
        getLevelDistribution(),
        getPackageDistribution(),
        getSourceDistribution(),
        getMonthlyRevenueHistory(),
      ]);
      return { levelDistribution, packageDistribution, sourceDistribution, monthlyRevenue };
    }),

    overview: adminProcedure.query(async () => {
      const [studentCounts, monthlyRevenue, totalRevenue, paymentStatus, upcomingCount, leadCounts, upcomingLessons] =
        await Promise.all([
          getStudentCount(),
          getMonthlyRevenue(),
          getTotalRevenue(),
          getPaymentsByStatus(),
          getUpcomingLessonCount(),
          getLeadCount(),
          getUpcomingLessons(5),
        ]);
      return {
        totalStudents: studentCounts.total,
        activeStudents: studentCounts.active,
        monthlyRevenue,
        totalRevenue,
        paymentStatus,
        upcomingLessons: upcomingCount,
        newLeads: leadCounts.new,
        totalLeads: leadCounts.total,
        nextLessons: upcomingLessons,
      };
    }),
  }),

  // ─── Students ──────────────────────────────────────────────────────────────
  students: router({
    list: adminProcedure
      .input(z.object({ search: z.string().optional(), status: z.string().optional(), level: z.string().optional() }).optional())
      .query(({ input }) => getStudents(input)),

    get: adminProcedure.input(z.object({ id: z.number() })).query(({ input }) => getStudentById(input.id)),

    create: adminProcedure.input(studentInput).mutation(({ input }) =>
      createStudent({
        ...input,
        email: input.email || undefined,
        enrolledAt: new Date(),
      })
    ),

    update: adminProcedure
      .input(z.object({ id: z.number(), data: studentInput.partial() }))
      .mutation(({ input }) => updateStudent(input.id, input.data)),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteStudent(input.id)),
  }),

  // ─── Payments ──────────────────────────────────────────────────────────────
  payments: router({
    list: adminProcedure
      .input(z.object({ studentId: z.number().optional() }).optional())
      .query(({ input }) => getPayments(input?.studentId)),

    create: adminProcedure.input(paymentInput).mutation(({ input }) => createPayment(input as any)),

    update: adminProcedure
      .input(z.object({ id: z.number(), data: paymentInput.partial() }))
      .mutation(({ input }) => updatePayment(input.id, input.data as any)),

    markPaid: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => updatePayment(input.id, { status: "paid", paidAt: new Date() })),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deletePayment(input.id)),
  }),

  // ─── Lessons ───────────────────────────────────────────────────────────────
  lessons: router({
    list: adminProcedure
      .input(z.object({ studentId: z.number().optional(), from: z.date().optional(), to: z.date().optional() }).optional())
      .query(({ input }) => getLessons(input)),

    upcoming: adminProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(({ input }) =>
      getUpcomingLessons(input?.limit ?? 10)
    ),

    create: adminProcedure.input(lessonInput).mutation(({ input }) => createLesson(input as any)),

    update: adminProcedure
      .input(z.object({ id: z.number(), data: lessonInput.partial() }))
      .mutation(({ input }) => updateLesson(input.id, input.data as any)),

    complete: adminProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(({ input }) => updateLesson(input.id, { status: "completed", notes: input.notes })),

    cancel: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => updateLesson(input.id, { status: "cancelled" })),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteLesson(input.id)),
  }),

  // ─── Progress Notes ────────────────────────────────────────────────────────
  progress: router({
    list: adminProcedure
      .input(z.object({ studentId: z.number() }))
      .query(({ input }) => getProgressNotes(input.studentId)),

    create: adminProcedure.input(progressNoteInput).mutation(({ input }) => createProgressNote(input as any)),

    update: adminProcedure
      .input(z.object({ id: z.number(), data: progressNoteInput.partial() }))
      .mutation(({ input }) => updateProgressNote(input.id, input.data as any)),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteProgressNote(input.id)),
  }),

  // ─── Leads ─────────────────────────────────────────────────────────────────
  leads: router({
    list: adminProcedure
      .input(z.object({ status: z.string().optional(), search: z.string().optional() }).optional())
      .query(({ input }) => getLeads(input?.status, input?.search)),

    create: adminProcedure.input(leadInput).mutation(({ input }) => createLead(input as any)),

    update: adminProcedure
      .input(z.object({ id: z.number(), data: leadInput.partial() }))
      .mutation(({ input }) => updateLead(input.id, input.data as any)),

    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: leadStatus }))
      .mutation(({ input }) => updateLead(input.id, { status: input.status })),

    convertToStudent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const leadResult = await getLeads(undefined, undefined, input.id);
        const lead = Array.isArray(leadResult) ? leadResult[0] : leadResult;
        if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        const student = await createStudent({
          name: lead.name ?? "Unknown",
          email: lead.email ?? undefined,
          whatsapp: lead.whatsapp ?? undefined,
          englishLevel: (lead.englishLevel as any) ?? "A1",
          goals: lead.goals ?? undefined,
          source: "onboarding_test" as any,
          status: "trial" as any,
          enrolledAt: new Date(),
        });
        await updateLead(input.id, { status: "converted", convertedToStudentId: student.id });
        return student;
      }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteLead(input.id)),

    // Public endpoint for onboarding test submissions
    submit: publicProcedure.input(leadInput).mutation(({ input }) => createLead(input as any)),
  }),
});

export type AppRouter = typeof appRouter;
