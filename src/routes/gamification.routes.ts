import { Router } from "express";
import gamificationController from "../controllers/gamification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/my-badges", authMiddleware, gamificationController.getUserBadges);

export default router;