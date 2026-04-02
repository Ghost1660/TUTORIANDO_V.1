import { Router } from "express";
import messageController from "../controllers/message.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Enviar un mensaje nuevo
router.post("/send", authMiddleware, messageController.send);

// Obtener el historial de chat con un usuario específico
router.get("/chat/:otherUserId", authMiddleware, messageController.getChat);

export default router;