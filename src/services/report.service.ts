import { User } from "../models/user.model";
import { LearningError } from "../models/learningError.model";

export const generateStudentReport = async (userId: string) => {
  const user = await User.findById(userId).populate("progresoAcademico.temaId");
  const errors = await LearningError.find({ user: userId });

  // Agrupamos errores por etiquetas para ver el punto débil
  const tagAnalysis: { [key: string]: number } = {};
  errors.forEach(err => {
    err.failedConceptTags.forEach(tag => {
      tagAnalysis[tag] = (tagAnalysis[tag] || 0) + 1;
    });
  });

  const averageScore = user?.progresoAcademico.length 
    ? user.progresoAcademico.reduce((acc, curr) => acc + (curr.calificacion || 0), 0) / user.progresoAcademico.length
    : 0;

  return {
    studentName: user?.name,
    averageScore: averageScore.toFixed(2),
    topicsCompleted: user?.progresoAcademico.filter(p => p.completado).length,
    weakPoints: Object.entries(tagAnalysis).sort((a, b) => b[1] - a[1]).slice(0, 3),
    recommendation: averageScore < 70 ? "Se sugiere refuerzo intensivo en conceptos lógicos." : "Progreso excelente."
  };
};