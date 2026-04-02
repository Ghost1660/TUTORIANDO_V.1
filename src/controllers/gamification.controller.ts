import { Request, Response } from "express";
import { User } from "../models/user.model";

const gamificationController = {
  getUserBadges: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      // Buscamos al usuario y traemos la información de las insignias
      const userData = await User.findById(user._id).populate("badges");
      
      res.json({
        total: userData?.badges.length || 0,
        badges: userData?.badges || []
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};

export default gamificationController;