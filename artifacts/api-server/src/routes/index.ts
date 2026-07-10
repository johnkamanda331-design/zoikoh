import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dailyRouter from "./daily";
import categoriesRouter from "./categories";
import questionsRouter from "./questions";
import sessionsRouter from "./sessions";
import achievementsRouter from "./achievements";
import statsRouter from "./stats";
import playersRouter from "./players";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dailyRouter);
router.use(categoriesRouter);
router.use(questionsRouter);
router.use(sessionsRouter);
router.use(achievementsRouter);
router.use(statsRouter);
router.use(playersRouter);

export default router;
