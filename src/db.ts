import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI no definida");
    await mongoose.connect(uri);
    console.log("✅ Conectado a MongoDB");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};