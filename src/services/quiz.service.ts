import { Quiz } from "../models/quiz.model";
import { Topic } from "../models/topic.model";
import { LearningError } from "../models/learningError.model";
import { markTopicAsComplete } from "./progress.service";
import { checkAndAwardBadges } from "./gamification.service"; // Importación clave

export const evaluateQuiz = async (userId: string, quizId: string, userAnswers: number[]) => {
  const quiz = await Quiz.findById(quizId).populate('topic');
  if (!quiz) throw new Error("Quiz no encontrado");

  let correctCount = 0;
  const failedTags: string[] = [];

  quiz.questions.forEach((q, index) => {
    if (q.correctAnswer === userAnswers[index]) {
      correctCount++;
    } else {
      const topicTags = (quiz.topic as any).tags || [];
      topicTags.forEach((t: string) => {
        if (!failedTags.includes(t)) failedTags.push(t);
      });
    }
  });

  const score = (correctCount / quiz.questions.length) * 100;
  const passed = score >= 70;

  if (passed) {
    await markTopicAsComplete(userId, quiz.topic._id.toString(), score);
  } else {
    await LearningError.create({
      user: userId,
      topic: quiz.topic._id,
      quiz: quizId,
      failedConceptTags: failedTags
    });
  }

  const recommendations = await Topic.find({
    tags: { $in: failedTags },
    _id: { $ne: quiz.topic._id }
  }).limit(3);

  // Verificamos si ganó medallas nuevas después de esta evaluación
  const newBadges = await checkAndAwardBadges(userId);

  return {
    score,
    passed,
    correctCount,
    totalQuestions: quiz.questions.length,
    recommendations,
    newBadges // Se envían al alumno para mostrar la animación de premio
  };
};