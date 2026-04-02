import { Topic } from "../models/topic.model";

export const createTopic = async (
  subjectId: string,
  title: string,
  description: string,
  tags: string[] = [],
  dificultad: number = 1,
  contentUrl?: string,
  textContent?: string
) => {
  const topic = await Topic.create({
    subject: subjectId,
    title,
    description,
    tags,
    dificultad,
    contentUrl,
    textContent
  });

  return topic;
};

export const getTopicsBySubject = async (subjectId: string) => {
  return await Topic.find({ subject: subjectId });
};