import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import interactionsRouter from "./interactions.js";
import ticketsRouter from "./tickets.js";
import statsRouter from "./stats.js";
import premiumRouter from "./premium.js";
import pagesRouter from "./pages.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(interactionsRouter);
router.use(ticketsRouter);
router.use(statsRouter);
router.use(premiumRouter);
router.use(pagesRouter);

export default router;
