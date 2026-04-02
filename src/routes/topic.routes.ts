import { Router } from "express";
import topicController from "../controllers/topic.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// El error suele ocurrir si haces: router.use(topicController) <- ERROR
// Debes asignar las funciones a rutas específicas:
router.post("/", authMiddleware, topicController.create);
router.get("/:subjectId", authMiddleware, topicController.bySubject);
router.get("/personalized/:subjectId", authMiddleware, topicController.getPersonalized);

export default router;