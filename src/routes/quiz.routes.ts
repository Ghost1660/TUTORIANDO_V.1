import { Router } from "express";
import quizController from "../controllers/quiz.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// ESTA ES LA LÍNEA QUE FALTA:
router.get("/topic/:topicId", authMiddleware, quizController.getByTopic);

router.post("/", authMiddleware, quizController.create);
router.post("/submit", authMiddleware, quizController.submitAnswers);

export default router;