import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";

const MAX_LIMIT = 10_000;

export async function transactionRoutes(
  app: FastifyInstance,
  pool: Pool
) {
  app.get<{
    Querystring: { limit?: string; offset?: string };
  }>("/api/transactions", async (request, reply) => {
    const limit = Math.min(
      parseInt(request.query.limit || "100", 10),
      MAX_LIMIT
    );
    const offset = parseInt(request.query.offset || "0", 10);

    const result = await pool.query(
      "SELECT * FROM transactions ORDER BY id ASC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM transactions"
    );

    reply.send({
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset,
    });
  });

  app.get("/api/transactions/count", async (_request, reply) => {
    const result = await pool.query("SELECT COUNT(*) FROM transactions");
    reply.send({ count: parseInt(result.rows[0].count, 10) });
  });

  app.get<{
    Querystring: { limit?: string; cursor?: string };
  }>("/api/transactions/cursor", async (request, reply) => {
    const limit = Math.min(
      parseInt(request.query.limit || "100", 10),
      MAX_LIMIT
    );
    const cursor = request.query.cursor;

    let cursorId = 0;
    if (cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(cursor, "base64").toString("utf-8")
        );
        cursorId = decoded.id;
      } catch {
        reply.status(400).send({ error: "Invalid cursor" });
        return;
      }
    }

    const result = await pool.query(
      "SELECT * FROM transactions WHERE id > $1 ORDER BY id ASC LIMIT $2",
      [cursorId, limit + 1]
    );

    const hasMore = result.rows.length > limit;
    const data = hasMore ? result.rows.slice(0, limit) : result.rows;
    const lastRow = data[data.length - 1];
    const nextCursor = hasMore && lastRow
      ? Buffer.from(JSON.stringify({ id: lastRow.id })).toString("base64")
      : null;

    reply.send({ data, nextCursor, hasMore });
  });
}
