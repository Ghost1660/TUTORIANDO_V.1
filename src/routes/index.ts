import { Router } from "express";
import homeController from "../controllers/home.controller";
import authRoutes from "./auth.routes";
import subjectRoutes from "./subject.routes";
import topicRoutes from "./topic.routes";
import diagnosticRoutes from "./diagnostic.routes";
import progressRoutes from "./progress.routes";
import quizRoutes from "./quiz.routes";
import reinforcementRoutes from "./reinforcement.routes";
import badgeRoutes from "./badges.routes";
import notificationRoutes from "./notification.routes";
import tutorRoutes from "./tutor.routes";
import messageRoutes from "./message.routes";
import commentRoutes from "./comment.routes"; // Nueva
import reportRoutes from "./report.routes";   // Nueva

const router = Router();

router.get("/", homeController.home);
router.use("/auth", authRoutes);
router.use("/subjects", subjectRoutes);
router.use("/topics", topicRoutes);
router.use("/diagnostic", diagnosticRoutes);
router.use("/progress", progressRoutes);
router.use("/quizzes", quizRoutes);
router.use("/reinforcement", reinforcementRoutes);
router.use("/gamification", badgeRoutes);
router.use("/notifications", notificationRoutes);
router.use("/tutor", tutorRoutes);
router.use("/messages", messageRoutes);
router.use("/comments", commentRoutes);
router.use("/reports", reportRoutes);

export default router;