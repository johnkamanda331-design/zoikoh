import { Router } from "express";
import { db } from "../lib/db";
import { categoriesTable, questionsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.id);

    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        const [result] = await db
          .select({ count: count() })
          .from(questionsTable)
          .where(eq(questionsTable.categoryId, cat.id));
        return {
          id: cat.id,
          name: cat.name,
          description: cat.description ?? null,
          questionCount: result?.count ?? 0,
        };
      })
    );

    res.json(withCounts);
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Failed to list categories" });
  }
});

export default router;
