import { Request, Response, RequestHandler } from "express";
import { createTopic, getTopicsBySubject } from "../services/topic.service";
import { personalizeContent } from "../services/intelligence.service";

// Definimos el controlador con tipos explícitos para evitar el error de "Application"
const topicController = {
  create: (async (req: Request, res: Response) => {
    try {
      const { subjectId, title, description, tags, dificultad } = req.body;
      const topic = await createTopic(subjectId, title, description, tags, dificultad);
      res.status(201).json({ message: "Tema creado", topic });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }) as RequestHandler,

  bySubject: (async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const topics = await getTopicsBySubject(subjectId);
      res.json(topics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }) as RequestHandler,

  getPersonalized: (async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const user = (req as any).user;
      const data = await personalizeContent(user, subjectId);
      res.json({ data });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }) as RequestHandler
};

export default topicController;