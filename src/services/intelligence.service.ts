import { Topic } from "../models/topic.model";
import { IUser } from "../models/user.model";

/**
 * Motor de Personalización: Ordena temas según el perfil del alumno.
 */
export const personalizeContent = async (user: IUser, subjectId: string) => {
  const topics = await Topic.find({ subject: subjectId });

  if (!user.perfilEducativo || !user.perfilEducativo.fortalezas) {
    return topics;
  }

  const { fortalezas, ritmoAprendizaje } = user.perfilEducativo;

  // Algoritmo de ordenamiento
  return topics.sort((a: any, b: any) => {
    let scoreA = 0;
    let scoreB = 0;

    // Puntos por fortalezas (tags coincidentes)
    fortalezas.forEach((f: string) => {
      if (a.tags?.includes(f)) scoreA += 10;
      if (b.tags?.includes(f)) scoreB += 10;
    });

    // Puntos por ritmo
    if (ritmoAprendizaje === "Detallado" && a.dificultad <= 2) scoreA += 5;
    if (ritmoAprendizaje === "Rápido" && a.dificultad >= 4) scoreA += 5;

    return scoreB - scoreA;
  });
};