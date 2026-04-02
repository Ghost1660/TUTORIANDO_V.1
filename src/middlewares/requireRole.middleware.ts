import { Request, Response, NextFunction } from "express";

/**
 * Middleware para restringir acceso según el rol del usuario.
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "No autorizado: Usuario no encontrado" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ 
        error: `Acceso denegado: Se requiere rol [${roles.join(" o ")}]. Tu rol actual es: ${user.role}` 
      });
    }

    next();
  };
};