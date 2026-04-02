import mongoose from 'mongoose';
import { Topic } from '../models/topic.model';
import { Quiz } from '../models/quiz.model';
import { Resource } from '../models/resource.model';
import { LearningError } from '../models/learningError.model';
// Prueba una de estas dos formas de importar:
import { Subject } from '../models/subject.model';

const MONGODB_URI = "mongodb://localhost:27017/tu_base_de_datos"; // CAMBIA EL NOMBRE DE TU DB AQUÍ

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🌱 Conexión establecida.");

    // LIMPIEZA SEGURA
    console.log("🧹 Limpiando colecciones...");
    if (Subject) await Subject.deleteMany({});
    await Topic.deleteMany({});
    await Quiz.deleteMany({});
    await Resource.deleteMany({});
    await LearningError.deleteMany({});

    const math: any = await Subject.create({
      name: "Matemáticas", // Antes decía title
      description: "Fundamentos matemáticos para ingeniería"
    });

    // 2. CREAR TEMA (Importante: 'subject' es el ID de la materia creada arriba)
    const algebraTopic: any = await Topic.create({
      subject: math._id,
      title: "1. Introducción al Álgebra",
      description: "Conceptos básicos para trabajar con variables.",
      tags: ["Lógico", "Práctico"], 
      dificultad: 1,
      contentUrl: "https://www.youtube.com/watch?v=EjMEY2Q2pI0",
      textContent: "El álgebra usa letras como 'x' para representar valores desconocidos..."
    });

    // 3. CREAR RECURSOS DE REFUERZO
    await Resource.create([
      {
        title: "Guía PDF: Trucos de Despeje",
        type: "pdf",
        url: "https://ejemplo.com/guia-algebra.pdf",
        topic: algebraTopic._id,
        tags: ["algebra", "refuerzo-necesario"],
        difficulty: 1
      },
      {
        title: "Video: ¿Por qué usamos letras?",
        type: "video",
        url: "https://www.youtube.com/watch?v=EjMEY2Q2pI0",
        topic: algebraTopic._id,
        tags: ["algebra", "refuerzo-necesario"],
        difficulty: 1
      }
    ]);

    // 4. CREAR QUIZ
    const quiz: any = await Quiz.create({
      topic: algebraTopic._id,
      questions: [
        {
          questionText: "¿Qué representa la 'x' en álgebra?",
          options: ["Un error", "Un valor desconocido", "Siempre es el número 10"],
          correctAnswer: 1
        }
      ]
    });

    console.log("\n✅ ¡SISTEMA SINCRONIZADO!");
    console.log("--------------------------------------------------");
    console.log("ID DEL QUIZ CREADO:", quiz._id);
    console.log("--------------------------------------------------");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error detallado en el seeding:", error);
    process.exit(1);
  }
};

seedDatabase();