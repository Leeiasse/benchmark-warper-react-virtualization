import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load root .env
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

import { faker } from "@faker-js/faker";
import { Client } from "pg";
import { from as copyFrom } from "pg-copy-streams";
import cliProgress from "cli-progress";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { parseArgs } from "util";

const { values } = parseArgs({
  options: {
    count: { type: "string", default: "100000" },
    host: { type: "string", default: process.env.POSTGRES_HOST || "localhost" },
    port: { type: "string", default: process.env.POSTGRES_PORT || "5432" },
    user: { type: "string", default: process.env.POSTGRES_USER || "bench" },
    password: { type: "string", default: process.env.POSTGRES_PASSWORD || "bench_password" },
    database: { type: "string", default: process.env.POSTGRES_DB || "bench_virtualization" },
  },
});

const COUNT = parseInt(values.count!, 10);
const BATCH_SIZE = 10_000;
const SEED = 42;

const STATUSES = ["completed", "pending", "failed", "refunded", "processing"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];
const CATEGORIES = [
  "food",
  "transport",
  "entertainment",
  "utilities",
  "shopping",
  "health",
  "education",
  "travel",
];

const METADATA_KEYS = [
  "ip_address",
  "device",
  "browser",
  "location",
  "risk_score",
];

function generateMetadata(id: number): Record<string, string | number> {
  const keyCount = (id * 7 + 3) % 6; // 0-5 keys, deterministic
  if (keyCount === 0) return {};

  const meta: Record<string, string | number> = {};
  for (let i = 0; i < keyCount; i++) {
    const key = METADATA_KEYS[i];
    switch (key) {
      case "ip_address":
        meta[key] = faker.internet.ipv4();
        break;
      case "device":
        meta[key] = faker.helpers.arrayElement(["mobile", "desktop", "tablet"]);
        break;
      case "browser":
        meta[key] = faker.helpers.arrayElement([
          "Chrome",
          "Firefox",
          "Safari",
          "Edge",
        ]);
        break;
      case "location":
        meta[key] = faker.location.country();
        break;
      case "risk_score":
        meta[key] = faker.number.int({ min: 0, max: 100 });
        break;
    }
  }
  return meta;
}

function escapeForCopy(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\t/g, "\\t")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

async function main() {
  console.log(`\nGenerating ${COUNT.toLocaleString()} transactions...\n`);

  faker.seed(SEED);

  const client = new Client({
    host: values.host,
    port: parseInt(values.port!, 10),
    user: values.user,
    password: values.password,
    database: values.database,
  });

  await client.connect();

  // Clear existing data
  await client.query("TRUNCATE transactions RESTART IDENTITY");
  console.log("Cleared existing data.\n");

  const bar = new cliProgress.SingleBar(
    {
      format:
        "Seeding |{bar}| {percentage}% | {value}/{total} | ETA: {eta_formatted}",
    },
    cliProgress.Presets.shades_classic
  );

  bar.start(COUNT, 0);

  const startTime = performance.now();
  const startDate = new Date("2023-01-01");
  const endDate = new Date("2025-12-31");

  // Use COPY for high-throughput insertion
  const copyStream = client.query(
    copyFrom(
      "COPY transactions (reference, amount, currency, status, merchant, category, metadata, created_at) FROM STDIN"
    )
  );

  let buffer = "";
  let generated = 0;

  const readable = new Readable({
    read() {
      while (generated < COUNT) {
        const id = generated + 1;
        const reference = `TXN-${String(id).padStart(10, "0")}`;
        const amount = faker.number.float({
          min: 0.01,
          max: 99999.99,
          fractionDigits: 2,
        });
        const currency = faker.helpers.arrayElement(CURRENCIES);
        const status = faker.helpers.arrayElement(STATUSES);
        const merchant = escapeForCopy(faker.company.name());
        const category = faker.helpers.arrayElement(CATEGORIES);
        const metadata = JSON.stringify(generateMetadata(id));
        const createdAt = faker.date
          .between({ from: startDate, to: endDate })
          .toISOString();

        buffer += `${reference}\t${amount}\t${currency}\t${status}\t${merchant}\t${category}\t${metadata}\t${createdAt}\n`;
        generated++;

        if (generated % BATCH_SIZE === 0) {
          bar.update(generated);
          const shouldContinue = this.push(buffer);
          buffer = "";
          if (!shouldContinue) return;
        }
      }

      // Flush remaining
      if (buffer.length > 0) {
        this.push(buffer);
        buffer = "";
      }
      bar.update(generated);
      this.push(null);
    },
  });

  await pipeline(readable, copyStream);

  bar.stop();

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(
    `\nInserted ${COUNT.toLocaleString()} rows in ${elapsed}s (${Math.round(COUNT / parseFloat(elapsed)).toLocaleString()} rows/s)`
  );

  // Verify
  const result = await client.query("SELECT COUNT(*) FROM transactions");
  console.log(`Verification: ${parseInt(result.rows[0].count).toLocaleString()} rows in database\n`);

  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
