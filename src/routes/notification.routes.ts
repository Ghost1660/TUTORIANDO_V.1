import { Router } from "express";
import notificationController from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, notificationController.getMyNotifications);

export default router;