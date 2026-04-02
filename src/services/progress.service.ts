import { User } from "../models/user.model";
import { Topic } from "../models/topic.model";

/**
 * Marca un tema como completado para un usuario específico.
 */
export const markTopicAsComplete = async (userId: string, topicId: string, calificacion: number = 100) => {
  // Verificamos si el tema ya estaba registrado en el progreso
  const user = await User.findById(userId);
  if (!user) throw new Error("Usuario no encontrado");

  const existingIndex = user.progresoAcademico.findIndex(
    (p) => p.temaId.toString() === topicId
  );

  if (existingIndex > -1) {
    // Si ya existe, actualizamos
    user.progresoAcademico[existingIndex].completado = true;
    user.progresoAcademico[existingIndex].fechaCompletado = new Date();
    user.progresoAcademico[existingIndex].calificacion = calificacion;
  } else {
    // Si no existe, lo agregamos (cast a any para evitar conflicto de tipos en el push)
    (user.progresoAcademico as any).push({
      temaId: topicId,
      completado: true,
      fechaCompletado: new Date(),
      calificacion
    });
  }

  await user.save();
  return user.progresoAcademico;
};

/**
 * Obtiene el porcentaje de progreso de un alumno en una materia.
 */
export const getSubjectProgress = async (userId: string, subjectId: string) => {
  const totalTopics = await Topic.countDocuments({ subject: subjectId });
  const user = await User.findById(userId).populate('progresoAcademico.temaId');
  
  if (!user || totalTopics === 0) return 0;

  // Filtramos los temas completados que pertenecen a esa materia
  const completedInSubject = user.progresoAcademico.filter((p: any) => {
    return p.completado && p.temaId.subject.toString() === subjectId;
  }).length;

  return (completedInSubject / totalTopics) * 100;
};