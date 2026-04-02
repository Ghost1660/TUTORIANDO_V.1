import mongoose from "mongoose";
import dotenv from "dotenv";
import { Subject } from "./models/subject.model";
import { Topic } from "./models/topic.model";
import { Quiz } from "./models/quiz.model";

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("⏳ Conectando a la base de datos...");
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("✅ Conectado.");

    console.log("🧹 Limpiando datos antiguos...");
    await Subject.deleteMany({});
    await Topic.deleteMany({});
    await Quiz.deleteMany({});

    // --- 1. CREAR LAS MATERIAS ---
    console.log("📚 Creando Materias Base...");
    const subjects = await Subject.insertMany([
      { name: "Matemáticas (Bachillerato)", description: "Álgebra, geometría, trigonometría y cálculo esencial." },
      { name: "Química (Bachillerato)", description: "Fundamentos atómicos, tabla periódica, enlaces y reacciones químicas." },
      { name: "Inglés A1-A2", description: "Gramática esencial, vocabulario cotidiano y comprensión de textos nivel principiante." }
    ]);

    // --- 2. CREAR LOS TEMAS ---
    console.log("📖 Creando Temas de estudio...");
    const topics = await Topic.insertMany([
      {
        subject: subjects[0]._id,
        title: "1. Introducción al Álgebra",
        description: "Conceptos básicos para trabajar con variables.",
        textContent: "El álgebra usa letras como 'x' para representar valores desconocidos...",
        contentUrl: "https://www.youtube.com/watch?v=EjMEY2Q2pI0",
        tags: ["Lógico", "Práctico"],
        dificultad: 1
      },
      {
        subject: subjects[1]._id,
        title: "1. Estructura Atómica",
        description: "Protones, neutrones y electrones.",
        textContent: "Toda la materia está formada por átomos...",
        contentUrl: "https://www.youtube.com/watch?v=p5A4z3g2s8o",
        tags: ["Visual", "Lógico"],
        dificultad: 1
      },
      {
        subject: subjects[2]._id,
        title: "1. El Verbo To Be",
        description: "Ser o Estar en inglés.",
        textContent: "I am, You are, He/She/It is...",
        contentUrl: "https://www.youtube.com/watch?v=33W_iL_QWq8",
        tags: ["Lectura", "Práctico"],
        dificultad: 1
      }
    ]);

    // --- 3. CREAR LOS EXÁMENES (Corregido a 'questionText') ---
    console.log("📝 Creando Exámenes...");
    await Quiz.insertMany([
      {
        topic: topics[0]._id,
        questions: [
          { 
            questionText: "En x + 5 = 12, ¿cuánto es x?", // <-- Nombre corregido
            options: ["5", "7", "12", "17"], 
            correctAnswer: 1 
          }
        ]
      },
      {
        topic: topics[1]._id,
        questions: [
          { 
            questionText: "¿Qué partículas se encuentran en el núcleo?", // <-- Nombre corregido
            options: ["Electrones", "Protones y Neutrones"], 
            correctAnswer: 1 
          }
        ]
      },
      {
        topic: topics[2]._id,
        questions: [
          { 
            questionText: "She ____ a doctor.", // <-- Nombre corregido
            options: ["am", "are", "is"], 
            correctAnswer: 2 
          }
        ]
      }
    ]);

    console.log("✅ ¡Semilla plantada exitosamente!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error poblando la base de datos:", error);
    process.exit(1);
  }
};

seedDatabase();