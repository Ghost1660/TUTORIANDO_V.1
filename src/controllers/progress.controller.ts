import { Request, Response } from "express";
import { markTopicAsComplete, getSubjectProgress } from "../services/progress.service";

const progressController = {
  completeTopic: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { topicId, calificacion } = req.body;

      const progress = await markTopicAsComplete(user._id, topicId, calificacion);
      
      res.json({
        message: "¡Felicidades! Tema completado.",
        progress
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  getStatus: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { subjectId } = req.params;

      const percentage = await getSubjectProgress(user._id, subjectId);
      
      res.json({
        subjectId,
        progressPercentage: `${percentage}%`
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default progressController;