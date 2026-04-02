import express from "express";
import cors from "cors";
import router from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api", router);

// Middleware de error siempre al final
app.use(errorHandler);

export default app;