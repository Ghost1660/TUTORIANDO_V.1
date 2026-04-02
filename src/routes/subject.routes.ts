import { Router } from "express";
import subjectController from "../controllers/subject.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/requireRole.middleware";

const router = Router();

// Crear materia (solo admin)
router.post("/", authMiddleware, requireRole("admin"), subjectController.create);

// Obtener todas las materias (todos los roles)
router.get("/", authMiddleware, subjectController.all);

export default router;