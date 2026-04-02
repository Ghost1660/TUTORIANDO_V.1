import { Schema, model } from "mongoose";

const resourceSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'pdf', 'exercise', 'article'], required: true },
  url: { type: String, required: true },
  topic: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  tags: [{ type: String }], // Ejemplo: ['ecuaciones', 'principiante']
  difficulty: { type: Number, min: 1, max: 3 }
}, { timestamps: true });

export const Resource = model("Resource", resourceSchema);