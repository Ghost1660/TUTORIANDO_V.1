import { Router } from "express";
import progressController from "../controllers/progress.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/complete", authMiddleware, progressController.completeTopic);
router.get("/status/:subjectId", authMiddleware, progressController.getStatus);

export default router;