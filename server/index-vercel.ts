import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouterVercel } from "./routers-vercel";
import { initDatabase } from "./db-turso";
import { createContext } from "./_core/context";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  // Initialize database tables and admin user
  try {
    await initDatabase();
  } catch (err) {
    console.error("[DB] Failed to initialize database:", err);
  }

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouterVercel,
      createContext,
    })
  );

  // Serve static frontend files
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log(`Fluentry Admin CRM running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
