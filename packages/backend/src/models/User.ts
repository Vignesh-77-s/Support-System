import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
// import { User as IUser } from "../../../frontend/src/types";

export type UserRole =
  | "Admin"
  | "Support Manager"
  | "Support Agent"
  | "Technical Lead"
  | "Merchant";

export interface IUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  status: "Active" | "Inactive";
  createdAt: string;
  token?: string; // Added for auth session
}
export interface IUserModel extends Omit<IUser, "id">, Document {
  password?: string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema: Schema<IUserModel> = new Schema(
  {
    name: { type: String, required: true },
    // need to id
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: [
        "Admin",
        "Support Manager",
        "Support Agent",
        "Technical Lead",
        "Merchant",
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    password: { type: String, required: true },
    createdAt: {
      type: String,
      default: () => new Date().toLocaleDateString("en-GB"),
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete (ret as any).__v;
        delete ret.password;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword: any) {
  if (!this.password) return false;
  console.log(enteredPassword, "----enteredPassword", this.password);
  // return enteredPassword === this.password;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUserModel>("User", userSchema);

export default User;
