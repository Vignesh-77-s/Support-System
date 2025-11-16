import mongoose, { Document, Schema } from "mongoose";
import {
  Notification as INotification,
  NotificationType,
} from "../../../frontend/src/types";

const attachmentSchema = new Schema({
  name: String,
  size: String,
  type: String,
  url: String,
});

export interface INotificationModel
  extends Omit<INotification, "id">,
    Document {}

const notificationSchema: Schema<INotificationModel> = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(NotificationType),
    },
    priority: { type: String, required: true, enum: ["Low", "Medium", "High"] },
    sender: { type: String, required: true },
    timestamp: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    attachments: [attachmentSchema],
    readAt: { type: Date },
  },
  {
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete (ret as any).__v;
      },
    },
  }
);

const Notification = mongoose.model<INotificationModel>(
  "Notification",
  notificationSchema
);
export default Notification;
