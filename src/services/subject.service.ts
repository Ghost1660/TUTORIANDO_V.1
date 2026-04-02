import { Subject } from "../models/subject.model";

export const createSubject = async (name: string, description: string, icon: string) => {
  const exists = await Subject.findOne({ name });
  if (exists) throw new Error("La materia ya existe");

  const subject = await Subject.create({
    name,
    description,
    icon
  });

  return subject;
};

export const getSubjects = async () => {
  return await Subject.find();
};