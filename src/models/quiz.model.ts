import { Schema, model, Document, Types } from "mongoose";

export interface IQuiz extends Document {
  topic: Types.ObjectId;
  questions: {
    questionText: string;
    options: string[];
    correctAnswer: number; // Índice de la opción correcta
  }[];
}

const quizSchema = new Schema<IQuiz>(
  {
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    questions: [
      {
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export const Quiz = model<IQuiz>("Quiz", quizSchema);