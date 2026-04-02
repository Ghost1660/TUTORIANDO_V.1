import { Schema, model, Document, Types } from "mongoose";

export interface IComment extends Document {
  user: Types.ObjectId;
  topic: Types.ObjectId;
  content: string;
  replies: {
    user: Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
}

const commentSchema = new Schema<IComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    content: { type: String, required: true },
    replies: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Comment = model<IComment>("Comment", commentSchema);