import { Message } from "../models/message.model";
import { createNotification } from "./notification.service";

/**
 * Envía un mensaje y genera una notificación para el destinatario
 */
export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content
  });

  // Notificamos al receptor que tiene un nuevo mensaje
  await createNotification(
    receiverId,
    "Nuevo mensaje",
    "Tienes un nuevo mensaje de chat",
    "system"
  );

  return message;
};

/**
 * Obtiene la conversación entre dos usuarios
 */
export const getChatHistory = async (userA: string, userB: string) => {
  return await Message.find({
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA }
    ]
  }).sort({ createdAt: 1 });
};