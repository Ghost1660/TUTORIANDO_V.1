import { Request, Response } from "express";
import * as reportService from "../services/report.service";

const reportController = {
  getStudentReport: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      // Solo el tutor o admin debería poder pedir esto
      const report = await reportService.generateStudentReport(studentId);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default reportController;