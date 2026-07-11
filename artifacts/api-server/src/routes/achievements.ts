import { Router, type Request, type Response } from "express";
import { db } from "../lib/db.js";

const router = Router();

router.get("/achievements", async (req: Request, res: Response) => {
  try {
    const playerName = req.query.playerName as string | undefined;
    const query = playerName
      ? `SELECT id, player_name AS "playerName", type, title, description, earned_at AS "earnedAt" FROM achievements WHERE player_name = $1`
      : `SELECT id, player_name AS "playerName", type, title, description, earned_at AS "earnedAt" FROM achievements`;
    const values = playerName ? [playerName] : [];
    const result = await (db as any).$client.query(query, values);

    (res as any).json(
      result.rows.map((a: any) => ({
        id: a.id,
        playerName: a.playerName,
        type: a.type,
        title: a.title,
        description: a.description,
        earnedAt: a.earnedAt.toISOString(),
      }))
    );
  } catch (err) {
    (req as any).log.error({ err }, "Failed to list achievements");
    (res as any).status(500).json({ error: "Failed to list achievements" });
  }
});

router.post("/achievements", async (req: Request, res: Response) => {
  try {
    const { playerName, type, title, description } = req.body;
    if (!playerName || !type || !title || !description) {
      (res as any).status(400).json({ error: "Missing required fields: playerName, type, title, description" });
      return;
    }

    const existingResult = await (db as any).$client.query(
      `SELECT id, player_name AS "playerName", type, title, description, earned_at AS "earnedAt" FROM achievements WHERE player_name = $1 AND type = $2`,
      [playerName, type]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      (res as any).json({
        id: existing.id,
        playerName: existing.playerName,
        type: existing.type,
        title: existing.title,
        description: existing.description,
        earnedAt: existing.earnedAt.toISOString(),
        alreadyEarned: true,
      });
      return;
    }

    const createdResult = await (db as any).$client.query(
      `INSERT INTO achievements (player_name, type, title, description) VALUES ($1, $2, $3, $4) RETURNING id, player_name AS "playerName", type, title, description, earned_at AS "earnedAt"`,
      [playerName, type, title, description]
    );
    const created = createdResult.rows[0];

    (res as any).status(201).json({
      id: created.id,
      playerName: created.playerName,
      type: created.type,
      title: created.title,
      description: created.description,
      earnedAt: created.earnedAt.toISOString(),
      alreadyEarned: false,
    });
  } catch (err) {
    (req as any).log.error({ err }, "Failed to award achievement");
    (res as any).status(500).json({ error: "Failed to award achievement" });
  }
});

export default router;
