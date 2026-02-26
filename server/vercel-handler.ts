/**
 * Vercel-specific Express handler.
 * This file is bundled by esbuild into api/_server.js during build.
 * It does NOT use the Manus SDK or OAuth — it uses simple JWT auth.
 */
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouterVercel } from "./routers-vercel";
import { initDatabase } from "./db-turso";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

// Simple context creator for Vercel (no Manus SDK)
// The routers-vercel.ts handles its own JWT auth via cookies
async function createVercelContext(opts: CreateExpressContextOptions) {
  return {
    req: opts.req,
    res: opts.res,
    user: null, // Vercel router uses its own cookie-based JWT auth
  };
}

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Initialize DB on first request
let dbInitialized = false;
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
    createContext: createVercelContext,
  })
);

export default app;
