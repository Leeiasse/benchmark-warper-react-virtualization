import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Local api/.env takes priority, root .env as fallback
dotenv.config({ path: resolve(__dirname, "..", ".env") });
dotenv.config({ path: resolve(__dirname, "..", "..", ".env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import pg from "pg";
import { transactionRoutes } from "./routes/transactions.js";

const { Pool } = pg;

const app = Fastify({ logger: true });

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  user: process.env.POSTGRES_USER || "bench",
  password: process.env.POSTGRES_PASSWORD || "bench_password",
  database: process.env.POSTGRES_DB || "bench_virtualization",
  max: 20,
});

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

await app.register(cors, {
  origin: CORS_ORIGIN.split(","),
});

await transactionRoutes(app, pool);

app.get("/health", async () => {
  const result = await pool.query("SELECT 1");
  return { status: "ok", db: result.rows.length === 1 };
});

const PORT = parseInt(process.env.API_PORT || "3001", 10);

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`API server running on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
