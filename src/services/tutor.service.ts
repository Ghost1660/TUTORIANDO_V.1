import { User } from "../models/user.model";

/**
 * Obtiene la lista de alumnos asignados a un tutor con su progreso resumido
 */
export const getMyStudentsProgress = async (tutorId: string) => {
  const tutor = await User.findById(tutorId).populate({
    path: 'alumnosAsignados',
    select: 'name email progresoAcademico perfilEducativo',
    populate: { path: 'progresoAcademico.temaId', select: 'title' }
  });

  if (!tutor) throw new Error("Tutor no encontrado");
  return tutor.alumnosAsignados;
};

/**
 * Asigna un alumno a un tutor
 */
export const assignStudentToTutor = async (tutorId: string, studentId: string) => {
  await User.findByIdAndUpdate(tutorId, { $addToSet: { alumnosAsignados: studentId } });
  await User.findByIdAndUpdate(studentId, { tutor: tutorId });
  return { message: "Alumno asignado correctamente" };
};