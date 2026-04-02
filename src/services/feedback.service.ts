import { LearningError } from "../models/learningError.model";
import { createNotification } from "./notification.service";

/**
 * El tutor envía un consejo sobre un error específico
 */
export const sendTutorFeedback = async (
  tutorName: string,
  userId: string,
  errorId: string,
  comment: string
) => {
  // 1. Buscamos el error para validar
  const errorRecord = await LearningError.findById(errorId);
  if (!errorRecord) throw new Error("Registro de error no encontrado");

  // 2. Marcamos el error como "atendido" o guardamos el feedback
  // Podríamos extender el modelo de error, pero por ahora notificamos al alumno
  await createNotification(
    userId,
    "¡Tu tutor te ha dejado un consejo!",
    `${tutorName} dice: ${comment}`,
    "feedback"
  );

  return { success: true, message: "Feedback enviado y notificado" };
};