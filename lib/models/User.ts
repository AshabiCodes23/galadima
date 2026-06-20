import mongoose, { Schema, Document, Model } from "mongoose";
import type { UserRole } from "@/lib/types";



export type { UserRole };

export interface IUser extends Document {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never send this back in a query result by default
    },
    role: {
      type: String,
      enum: ["super_admin", "department_head", "staff", "hr_admin"],
      required: true,
    },
    department: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Mongoose re-uses the model if it's already compiled — stops Next.js's
// hot-reload from throwing "model already exists" errors.
interface IUserModel extends Model<IUser> {
  generateEmployeeId(): Promise<string>;
}

UserSchema.statics.generateEmployeeId = async function (): Promise<string> {
  const count = await this.countDocuments();
  const padded = String(count + 1).padStart(4, "0");
  return `HG-${padded}`;
};

const User = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;