import { Router } from "express";
import reinforcementController from "../controllers/reinforcement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/pending", authMiddleware, reinforcementController.getPendingReinforcements);

export default router;