import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouterVercel } from "../server/routers-vercel";
import { initDatabase } from "../server/db-turso";
import { createContext } from "../server/_core/context";

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
    createContext,
  })
);

export default app;
