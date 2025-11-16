import mongoose, { Document, Schema } from "mongoose";
import {
  AuditLog as IAuditLog,
  AuditLogAction,
} from "../../../frontend/src/types";

export interface IAuditLogModel extends Omit<IAuditLog, "id">, Document {}

const auditLogSchema: Schema<IAuditLogModel> = new Schema(
  {
    timestamp: { type: String, required: true },
    user: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(AuditLogAction),
    },
    details: { type: String, required: true },
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

const AuditLog = mongoose.model<IAuditLogModel>("AuditLog", auditLogSchema);
export default AuditLog;
