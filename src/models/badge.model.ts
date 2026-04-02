import { Schema, model, Document } from "mongoose";

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string; // Nombre del icono o URL
  criteria: "first_quiz" | "perfect_score" | "subject_master" | "streak_3";
}

const badgeSchema = new Schema<IBadge>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    criteria: { 
      type: String, 
      enum: ["first_quiz", "perfect_score", "subject_master", "streak_3"],
      required: true 
    }
  },
  { timestamps: true }
);

export const Badge = model<IBadge>("Badge", badgeSchema);