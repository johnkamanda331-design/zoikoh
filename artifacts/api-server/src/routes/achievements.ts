import { Router } from "express";
import { db } from "../lib/db.js";
import { achievementsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/achievements", async (req, res) => {
  try {
    const playerName = req.query.playerName as string | undefined;

    const achievements = playerName
      ? await db.select().from(achievementsTable).where(eq(achievementsTable.playerName, playerName))
      : await db.select().from(achievementsTable);

    res.json(
      achievements.map((a) => ({
        id: a.id,
        playerName: a.playerName,
        type: a.type,
        title: a.title,
        description: a.description,
        earnedAt: a.earnedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list achievements");
    res.status(500).json({ error: "Failed to list achievements" });
  }
});

router.post("/achievements", async (req, res) => {
  try {
    const { playerName, type, title, description } = req.body;
    if (!playerName || !type || !title || !description) {
      res.status(400).json({ error: "Missing required fields: playerName, type, title, description" });
      return;
    }

    // Idempotent — don't re-award the same achievement
    const existing = await db
      .select()
      .from(achievementsTable)
      .where(and(eq(achievementsTable.playerName, playerName), eq(achievementsTable.type, type)));

    if (existing.length > 0) {
      res.json({
        id: existing[0].id,
        playerName: existing[0].playerName,
        type: existing[0].type,
        title: existing[0].title,
        description: existing[0].description,
        earnedAt: existing[0].earnedAt.toISOString(),
        alreadyEarned: true,
      });
      return;
    }

    const [created] = await db
      .insert(achievementsTable)
      .values({ playerName, type, title, description })
      .returning();

    res.status(201).json({
      id: created.id,
      playerName: created.playerName,
      type: created.type,
      title: created.title,
      description: created.description,
      earnedAt: created.earnedAt.toISOString(),
      alreadyEarned: false,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to award achievement");
    res.status(500).json({ error: "Failed to award achievement" });
  }
});

export default router;
