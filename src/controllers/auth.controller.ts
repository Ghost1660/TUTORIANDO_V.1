import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";

const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      const user = await registerUser(name, email, password);

      res.status(201).json({
        message: "Usuario registrado correctamente",
        user
      });

    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const data = await loginUser(email, password);

      res.json({
        message: "Login correcto",
        token: data.token,
        user: data.user
      });

    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default authController;