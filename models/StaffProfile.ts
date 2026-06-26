// room-booking/models/StaffProfile.ts

import mongoose from "mongoose";

const staffProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    employeeNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // ✅ FIXED: enum now matches every value the form can send
    position: {
      type: String,
      required: true,
      enum: [
        "property_manager",
        "receptionist",
        "caretaker",
        "accountant",
        "security",
        "maintenance",
      ],
    },

    department: {
      type: String,
      default: "",
    },

    hireDate: {
      type: Date,
      required: true,
    },

    salary: {
      type: Number,
      default: 0,
    },

    emergencyContact: {
      name:         { type: String, default: "" },
      phone:        { type: String, default: "" },
      relationship: { type: String, default: "" },
    },

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.StaffProfile ||
  mongoose.model("StaffProfile", staffProfileSchema);