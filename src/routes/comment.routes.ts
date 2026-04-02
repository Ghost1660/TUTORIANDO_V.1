import { Router } from "express";
import commentController from "../controllers/comment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/topic/:topicId", authMiddleware, commentController.getByTopic);
router.post("/", authMiddleware, commentController.create);
router.post("/reply/:commentId", authMiddleware, commentController.reply);

export default router;