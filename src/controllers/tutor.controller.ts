import { Request, Response } from "express";
import * as tutorService from "../services/tutor.service";

const tutorController = {
  // Ver progreso de mis alumnos
  getDashboard: async (req: Request, res: Response) => {
    try {
      const tutorId = (req as any).user._id;
      const students = await tutorService.getMyStudentsProgress(tutorId);
      res.json(students);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Asignar un alumno manualmente (por email)
  addStudent: async (req: Request, res: Response) => {
    try {
      const tutorId = (req as any).user._id;
      const { studentId } = req.body;
      const result = await tutorService.assignStudentToTutor(tutorId, studentId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default tutorController;