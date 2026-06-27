// models/ContactMessage.ts
import mongoose from "mongoose";

const ContactMessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", ContactMessageSchema);