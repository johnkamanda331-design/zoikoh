import { Router } from "express";
import healthRouter from "./health.js";
import dailyRouter from "./daily.js";
import categoriesRouter from "./categories.js";
import questionsRouter from "./questions.js";
import sessionsRouter from "./sessions.js";
import achievementsRouter from "./achievements.js";
import statsRouter from "./stats.js";
import playersRouter from "./players.js";
import analyticsRouter from "./analytics.js";

const router = Router();

router.use(healthRouter);
router.use(dailyRouter);
router.use(categoriesRouter);
router.use(questionsRouter);
router.use(sessionsRouter);
router.use(achievementsRouter);
router.use(statsRouter);
router.use(playersRouter);
router.use(analyticsRouter);

export default router;
