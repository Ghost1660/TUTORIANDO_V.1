import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI as string;

    if (!uri) {
      throw new Error("❌ No se encontró la variable MONGO_URI en el .env");
    }

    await mongoose.connect(uri);
    console.log("✅ Conexión a MongoDB exitosa");
  } catch (error) {
    console.error("❌ Error al conectar:", error);
    process.exit(1);
  }
};