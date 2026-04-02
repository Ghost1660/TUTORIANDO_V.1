import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "alumno" | "tutor" | "admin";
  perfilEducativo?: {
    fortalezas: string[];
    ritmoAprendizaje: string;
    intereses: string[];
  };
  progresoAcademico: {
    temaId: Types.ObjectId;
    completado: boolean;
    fechaCompletado?: Date;
    calificacion?: number;
  }[];
  badges: Types.ObjectId[];
  // NUEVO: Relación Tutor-Alumno
  tutor?: Types.ObjectId; 
  alumnosAsignados?: Types.ObjectId[];
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["alumno", "tutor", "admin"], default: "alumno" },
    perfilEducativo: {
      fortalezas: { type: [String], default: [] },
      ritmoAprendizaje: { type: String, default: "Moderado" },
      intereses: { type: [String], default: [] }
    },
    progresoAcademico: [
      {
        temaId: { type: Schema.Types.ObjectId, ref: "Topic" },
        completado: { type: Boolean, default: false },
        fechaCompletado: { type: Date },
        calificacion: { type: Number, default: 0 }
      }
    ],
    badges: [{ type: Schema.Types.ObjectId, ref: "Badge" }],
    tutor: { type: Schema.Types.ObjectId, ref: "User" },
    alumnosAsignados: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);