import { Request, Response } from "express";
import { processDiagnostic } from "../services/diagnostic.service";

const diagnosticController = {
  submitTest: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { answers } = req.body;

      const updatedUser = await processDiagnostic(user._id, answers);

      res.json({
        message: "Perfil educativo actualizado con éxito",
        perfil: updatedUser?.perfilEducativo
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default diagnosticController;