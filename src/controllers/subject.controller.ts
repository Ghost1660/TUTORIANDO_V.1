import { Request, Response } from "express";
import { createSubject, getSubjects } from "../services/subject.service";

const subjectController = {
  create: async (req: Request, res: Response) => {
    try {
      const { name, description, icon } = req.body;

      const subject = await createSubject(name, description, icon);

      res.status(201).json({
        message: "Materia creada correctamente",
        subject
      });

    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  all: async (req: Request, res: Response) => {
    try {
      const subjects = await getSubjects();
      res.json(subjects);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default subjectController;