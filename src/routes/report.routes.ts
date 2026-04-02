import { Router } from "express";
import reportController from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/requireRole.middleware";

const router = Router();

// Solo tutores y admins pueden ver reportes detallados
router.get("/student/:studentId", authMiddleware, requireRole(["tutor", "admin"]), reportController.getStudentReport);

export default router;