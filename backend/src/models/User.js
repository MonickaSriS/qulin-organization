import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // optional — org-level admins may have none
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false }, // never returned by default
    role: { type: String, enum: ["admin", "manager"], default: "manager" },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
