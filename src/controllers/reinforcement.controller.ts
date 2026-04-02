import { Request, Response } from "express";
import { LearningError } from "../models/learningError.model";
import { Resource } from "../models/resource.model";

const reinforcementController = {
  getPendingReinforcements: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      console.log("🔍 Buscando refuerzos para el usuario:", user.id);

      // 1. Buscamos errores no resueltos
      const errors = await LearningError.find({ 
        user: user.id, 
        resolved: false 
      }).populate('topic');

      if (errors.length === 0) {
        return res.json({
          message: "¡Felicidades! No tienes temas pendientes por reforzar.",
          needsReview: [],
          recommendedResources: []
        });
      }

      // 2. Extraer tags y IDs de temas fallidos
      const tagsToReview = [...new Set(errors.flatMap(e => e.failedConceptTags))];
      const topicIds = errors.map(e => e.topic?._id).filter(id => id != null);

      console.log("Tags detectados:", tagsToReview);
      console.log("IDs de temas fallidos:", topicIds);

      // 3. Buscar recursos que coincidan con los tags O con el ID del tema
      const recommendedResources = await Resource.find({
        $or: [
          { tags: { $in: tagsToReview } },
          { topic: { $in: topicIds } }
        ]
      });

      console.log("📊 Recursos encontrados en la DB:", recommendedResources.length);

      res.json({
        summary: `Tienes ${errors.length} temas que requieren atención.`,
        needsReview: errors,
        recommendedResources: recommendedResources,
        suggestedAction: "Revisa los materiales recomendados antes de intentar el quiz de nuevo."
      });

    } catch (error: any) {
      console.error("❌ Error en reinforcement controller:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

export default reinforcementController;