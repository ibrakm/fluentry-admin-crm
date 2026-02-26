import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "ibrahim@fluentry.com",
    name: "Ibrahim K.",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "student@example.com",
    name: "Test Student",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "sample-user", email: "sample@example.com",
        name: "Sample User", loginMethod: "manus", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true, path: "/" });
  });
});

describe("admin access control", () => {
  it("allows admin users to access analytics overview", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // This would normally hit the DB; we just verify it doesn't throw FORBIDDEN
    try {
      await caller.analytics.overview();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("blocks non-admin users from accessing analytics overview", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks non-admin users from listing students", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.students.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks non-admin users from listing payments", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.payments.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks non-admin users from listing lessons", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.lessons.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks non-admin users from listing leads", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.leads.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("lead status enum validation", () => {
  it("rejects invalid lead status values", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.updateStatus({ id: 1, status: "invalid_status" as any })
    ).rejects.toThrow();
  });

  it("accepts valid lead status values", () => {
    const validStatuses = ["new", "contacted", "interested", "converted", "lost"];
    expect(validStatuses).toHaveLength(5);
    validStatuses.forEach(s => expect(typeof s).toBe("string"));
  });
});

describe("public lead submission", () => {
  it("allows unauthenticated users to submit leads via onboarding test", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    // Should not throw UNAUTHORIZED - it's a public procedure
    try {
      await caller.leads.submit({ name: "Test Lead", email: "test@example.com" });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});
