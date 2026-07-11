import { Router } from "express";
import { db } from "../lib/db.js";

const router = Router();

router.get("/categories", async (req: any, res: any) => {
  try {
    const categoriesResult = await (db as any).$client.query(
      `SELECT id, name, description FROM categories ORDER BY id`
    );

    const categories = categoriesResult.rows;

    const withCounts = await Promise.all(
      categories.map(async (cat: any) => {
        const countResult = await (db as any).$client.query(
          `SELECT COUNT(*)::int AS count FROM questions WHERE category_id = $1`,
          [cat.id]
        );

        return {
          id: cat.id,
          name: cat.name,
          description: cat.description ?? null,
          questionCount: countResult.rows?.[0]?.count ?? 0,
        };
      })
    );

    (res as any).json(withCounts);
  } catch (err) {
    (req as any).log.error({ err }, "Failed to list categories");
    (res as any).status(500).json({ error: "Failed to list categories" });
  }
});

export default router;
