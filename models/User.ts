// room-booking/models/User.ts

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      // ✅ FIXED: added "tenant" (was the default but missing from enum),
      // added all staff roles to match admin layout expectations
      enum: [
        "admin",
        "tenant",
        "guest",
        "property_manager",
        "receptionist",
        "caretaker",
        "accountant",
        "security",
        "maintenance",
      ],
      default: "tenant",
    },
    photo: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },

    resetPasswordToken:   { type: String  },
    resetPasswordExpires: { type: Date    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);