import { Router } from "express";
import tutorController from "../controllers/tutor.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/requireRole.middleware";

const router = Router();

// Solo usuarios con rol 'tutor' o 'admin' pueden ver el progreso de alumnos
router.get(
  "/dashboard", 
  authMiddleware, 
  requireRole(["tutor", "admin"]), 
  tutorController.getDashboard
);

// Solo usuarios con rol 'tutor' o 'admin' pueden asignar alumnos
router.post(
  "/assign", 
  authMiddleware, 
  requireRole(["tutor", "admin"]), 
  tutorController.addStudent
);

export default router;