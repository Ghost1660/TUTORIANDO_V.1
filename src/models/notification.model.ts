import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  type: "badge" | "feedback" | "system";
  read: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["badge", "feedback", "system"], default: "system" },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema);