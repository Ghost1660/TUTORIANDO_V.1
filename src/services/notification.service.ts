import { Notification } from "../models/notification.model";

export const createNotification = async (userId: string, title: string, message: string, type: string) => {
  return await Notification.create({
    user: userId,
    title,
    message,
    type
  });
};

export const getUserNotifications = async (userId: string) => {
  return await Notification.find({ user: userId }).sort({ createdAt: -1 });
};