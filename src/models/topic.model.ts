import { Schema, model, Document, Types } from "mongoose";

export interface ITopic extends Document {
  subject: Types.ObjectId;
  title: string;
  description: string;
  tags: ("Visual" | "Auditivo" | "Práctico" | "Lógico")[];
  dificultad: number;
  contentUrl?: string;    // URL a video de YouTube o PDF en Drive
  textContent?: string;   // Texto o explicaciones escritas
}

const topicSchema = new Schema<ITopic>(
  {
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    tags: { 
      type: [String], 
      enum: ["Lógico", "Visual", "Auditivo", "Práctico", "Lectura"], 
      required: true 
    },
    dificultad: { type: Number, min: 1, max: 5, default: 1 },
    contentUrl: { type: String },
    textContent: { type: String }
  },
  { timestamps: true }
);

export const Topic = model<ITopic>("Topic", topicSchema);