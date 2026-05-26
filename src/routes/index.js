import { Router } from "express";
import ticketsRouter from "./tickets.js";
import statsRouter from "./stats.js";
import premiumRouter from "./premium.js";

const router = Router();

router.get("/healthz", (_req, res) => res.json({ status: "ok" }));
router.use(ticketsRouter);
router.use(statsRouter);
router.use(premiumRouter);

export default router;
