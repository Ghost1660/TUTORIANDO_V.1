import { Schema, model, Document } from "mongoose";

export interface IProgress extends Document {
  userId: Schema.Types.ObjectId;
  topicId: Schema.Types.ObjectId;
  score: number;
  date: Date;
}

const progressSchema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

export default model<IProgress>("Progress", progressSchema);