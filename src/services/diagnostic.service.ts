import { User } from "../models/user.model";

/**
 * Procesa las respuestas del test y actualiza el perfil del usuario.
 */
export const processDiagnostic = async (userId: string, answers: any) => {
  let visualPoints = 0;
  let logicPoints = 0;
  let practicalPoints = 0;

  // 1. Lógica de puntuación basada en las respuestas
  if (answers.q1 === 'a') visualPoints++;
  if (answers.q1 === 'b') logicPoints++;
  
  if (answers.q2 === 'a') practicalPoints++;
  if (answers.q2 === 'b') visualPoints++;

  // 2. Definimos el array de fortalezas con un tipo explícito para evitar el error 'never'
  const strengths: string[] = []; 

  // 3. Determinamos la fortaleza principal según el puntaje
  if (visualPoints >= logicPoints && visualPoints >= practicalPoints) {
    strengths.push("Visual");
  }
  if (logicPoints > visualPoints && logicPoints >= practicalPoints) {
    strengths.push("Lógico");
  }
  if (practicalPoints > visualPoints && practicalPoints > logicPoints) {
    strengths.push("Práctico");
  }

  // Si no hay puntos claros, asignamos una por defecto
  if (strengths.length === 0) {
    strengths.push("Visual");
  }

  // 4. Actualizamos el perfil educativo del usuario en la base de datos
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      perfilEducativo: {
        fortalezas: strengths,
        ritmoAprendizaje: answers.speed || "Moderado",
        intereses: answers.interests || []
      }
    },
    { new: true } // Para que devuelva el documento actualizado
  );

  return updatedUser;
};