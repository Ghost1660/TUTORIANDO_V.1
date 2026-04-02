import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db"; // <--- Cambiado a ./db
import router from "./routes/index";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});

export default app;