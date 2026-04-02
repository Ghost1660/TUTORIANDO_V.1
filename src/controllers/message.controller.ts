import { Request, Response } from "express";
import * as messageService from "../services/message.service";

const messageController = {
  send: async (req: Request, res: Response) => {
    try {
      const senderId = (req as any).user._id;
      const { receiverId, content } = req.body;
      const message = await messageService.sendMessage(senderId, receiverId, content);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  getChat: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id;
      const { otherUserId } = req.params;
      const history = await messageService.getChatHistory(userId, otherUserId);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default messageController;