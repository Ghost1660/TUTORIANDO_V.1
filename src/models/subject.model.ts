import { Schema, model } from "mongoose";

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" }, // opcional, por si quieres poner iconos
  },
  {
    timestamps: true
  }
);

export const Subject = model("Subject", subjectSchema);