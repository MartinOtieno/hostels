// room-booking/models/ViewingRequest.ts

import mongoose from "mongoose";
import "./User"; // ensures User schema is always registered for populate
import "./Room"; // ensures Room schema is always registered for populate

const viewingRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ViewingRequest ||
  mongoose.model("ViewingRequest", viewingRequestSchema);