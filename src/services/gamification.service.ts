import { User } from "../models/user.model";
import { Badge } from "../models/badge.model";
import { Types } from "mongoose";
import { createNotification } from "./notification.service"; // Importación nueva

export const checkAndAwardBadges = async (userId: string) => {
  const user = await User.findById(userId).populate("badges");
  if (!user) return [];

  const newBadges: Types.ObjectId[] = [];
  const existingBadgeNames = (user.badges as any).map((b: any) => b.criteria);

  // 1. Logro: Perfecto
  if (!existingBadgeNames.includes("perfect_score")) {
    const hasPerfectScore = user.progresoAcademico.some(p => p.calificacion === 100);
    if (hasPerfectScore) {
      const badge = await Badge.findOne({ criteria: "perfect_score" });
      if (badge) {
        newBadges.push(badge._id as Types.ObjectId);
        await createNotification(userId, "🏆 ¡Nueva Medalla!", `Ganaste: ${badge.name}`, "badge");
      }
    }
  }

  // 2. Logro: Constancia
  if (!existingBadgeNames.includes("streak_3")) {
    const completedCount = user.progresoAcademico.filter(p => p.completado).length;
    if (completedCount >= 3) {
      const badge = await Badge.findOne({ criteria: "streak_3" });
      if (badge) {
        newBadges.push(badge._id as Types.ObjectId);
        await createNotification(userId, "🔥 ¡Imparable!", "Has completado 3 temas.", "badge");
      }
    }
  }

  if (newBadges.length > 0) {
    user.badges.push(...(newBadges as any));
    await user.save();
  }

  return newBadges;
};