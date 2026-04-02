import { Router } from "express";
import diagnosticController from "../controllers/diagnostic.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/submit", authMiddleware, diagnosticController.submitTest);

export default router;