import { Request, Response } from "express";
import { Quiz } from "../models/quiz.model"; 
import Progress from "../models/progress.model"; 
import { LearningError } from "../models/learningError.model"; 

class QuizController {
  
  // 1. Obtener quiz por el ID del tema
  async getByTopic(req: Request, res: Response) {
    try {
      const { topicId } = req.params;
      const quiz = await Quiz.findOne({ topic: topicId }).populate("questions");

      if (!quiz) {
        return res.status(404).json({ message: "No se encontró un quiz para este tema" });
      }

      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener el quiz", error });
    }
  }

  // 2. Procesar respuestas, guardar progreso y generar errores de aprendizaje
  async submitAnswers(req: Request, res: Response) {
    try {
      const { quizId, answers } = req.body;
      const userId = (req as any).user.id; 

      // Buscamos el quiz y sus preguntas
      const quiz = await Quiz.findById(quizId).populate("questions");
      if (!quiz) {
        return res.status(404).json({ message: "Quiz no encontrado" });
      }

      let correctAnswers = 0;
      const questions = quiz.questions as any[];

      // Comparar respuestas
      const results = questions.map((question: any, index: number) => {
        const isCorrect = question.correctAnswer === answers[index];
        if (isCorrect) correctAnswers++;
        return {
          questionId: question._id,
          isCorrect
        };
      });

      const score = (correctAnswers / questions.length) * 100;
      const topicId = (quiz as any).topic;

      // --- LÓGICA DE REFUERZO (IA) ---
      // Si el score es bajo (< 70), creamos el LearningError para que la IA lo detecte
      if (score < 70) {
        await LearningError.create({
          user: userId,
          topic: topicId,
          quiz: quizId, // Agregado para cumplir con la validación de tu modelo
          failedConceptTags: ["algebra", "refuerzo-necesario"], 
          resolved: false
        });
      }

      // Guardar el registro de progreso general
      const newProgress = new Progress({
        userId,
        topicId,
        score,
        date: new Date()
      });

      await newProgress.save();

      res.json({
        message: "Quiz completado con éxito",
        score,
        passed: score >= 70,
        results
      });
    } catch (error: any) {
      console.error("Error detallado:", error);
      res.status(500).json({ 
        message: "Error al procesar el quiz", 
        error: error.message 
      });
    }
  }

  // 3. Crear quiz (Admin)
  async create(req: Request, res: Response) {
    try {
      const newQuiz = new Quiz(req.body);
      await newQuiz.save();
      res.status(201).json(newQuiz);
    } catch (error) {
      res.status(500).json({ message: "Error al crear el quiz", error });
    }
  }
}

export default new QuizController();