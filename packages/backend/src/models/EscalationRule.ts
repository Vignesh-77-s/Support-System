// models/EscalationRule.ts
import mongoose, { Document, Schema } from "mongoose";
import {
  EscalationRule as IEscalationRule,
  TicketPriority,
  UserRole,
} from "../../../frontend/src/types";

export interface IEscalationRuleModel
  extends Omit<IEscalationRule, "id">,
    Document {}

const escalationRuleSchema: Schema<IEscalationRuleModel> = new Schema(
  {
    priority: {
      type: String,
      required: true,
      enum: Object.values(TicketPriority),
    },
    timeInHours: {
      type: Number,
      required: true,
      min: 1,
    },
    escalateToRole: {
      type: String,
      required: true,
      enum: ["Admin", "Support Manager", "Support Agent", "Technical Lead"],
    },
    escalationLevel: {
      type: Number,
      default: 1, // 1 = first escalation, 2 = second escalation, etc.
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
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

const EscalationRule = mongoose.model<IEscalationRuleModel>(
  "EscalationRule",
  escalationRuleSchema
);
export default EscalationRule;
