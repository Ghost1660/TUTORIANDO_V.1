import { Schema, model, Document, Types } from "mongoose";

export interface ILearningError extends Document {
  user: Types.ObjectId;
  topic: Types.ObjectId;
  quiz: Types.ObjectId;
  failedConceptTags: string[]; // Qué tags falló (ej: ["Lógico"])
  resolved: boolean;
}

const learningErrorSchema = new Schema<ILearningError>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    failedConceptTags: [{ type: String }],
    resolved: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const LearningError = model<ILearningError>("LearningError", learningErrorSchema);