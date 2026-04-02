import { Request, Response } from "express";
import * as notificationService from "../services/notification.service";

const notificationController = {
  getMyNotifications: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id;
      const notifications = await notificationService.getUserNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default notificationController;