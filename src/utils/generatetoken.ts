import jwt from "jsonwebtoken";

export const generatetoken = (id: string) => {
  const secret = process.env.JWT_SECRET as string;

  if (!secret) {
    throw new Error("JWT_SECRET no está configurado en el archivo .env");
  }

  return jwt.sign({ id }, secret, {
    expiresIn: "7d",
  });
};