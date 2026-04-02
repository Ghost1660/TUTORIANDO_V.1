import { Router } from "express";
import authController from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/requireRole.middleware";


const router = Router();

// Registro
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Ruta protegida por JWT (solo comprobar autenticación)
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Acceso correcto",
    user: (req as any).user
  });
});

// Ruta solo para ADMIN
router.get(
  "/admin-only",
  authMiddleware,
  requireRole(["admin"]),
  (req, res) => {
    res.json({
      message: "Acceso permitido solo a administrador",
      user: (req as any).user
    });
  }
);

export default router;