import { Request, Response } from "express";
import { Comment } from "../models/comment.model";

const commentController = {
  // Crear un comentario nuevo en un tema
  create: async (req: Request, res: Response) => {
    try {
      const { topicId, content } = req.body;
      const userId = (req as any).user._id;

      const newComment = await Comment.create({
        user: userId,
        topic: topicId,
        content
      });

      res.status(201).json(newComment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Responder a un comentario existente
  reply: async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = (req as any).user._id;

      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ error: "Comentario no encontrado" });

      comment.replies.push({ user: userId, content, createdAt: new Date() });
      await comment.save();

      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Obtener todos los comentarios de un tema específico
  getByTopic: async (req: Request, res: Response) => {
    try {
      const { topicId } = req.params;
      const comments = await Comment.find({ topic: topicId })
        .populate("user", "name")
        .populate("replies.user", "name")
        .sort({ createdAt: -1 });
      res.json(comments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default commentController;