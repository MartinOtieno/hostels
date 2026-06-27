// lib/createNotification.ts
// ─── Helper used by booking, viewing, and register routes ────────────────────
// Call this server-side whenever you want to push a notification to a user.

import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

interface NotificationPayload {
  userId: string | mongoose.Types.ObjectId;
  type:
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_pending"
    | "checkin_reminder"
    | "checkout_reminder"
    | "viewing_approved"
    | "viewing_rejected"
    | "viewing_pending"
    | "welcome"
    | "general";
  title: string;
  message: string;
  link?: string;
  refId?: string | mongoose.Types.ObjectId;
  refModel?: "Booking" | "ViewingRequest" | null;
}

export async function createNotification(payload: NotificationPayload) {
  try {
    await connectDB();
    await Notification.create({
      user:     payload.userId,
      type:     payload.type,
      title:    payload.title,
      message:  payload.message,
      link:     payload.link     ?? "",
      refId:    payload.refId    ?? null,
      refModel: payload.refModel ?? null,
      isRead:   false,
    });
  } catch (err) {
    // Never let notification failure break the main action
    console.error("createNotification error:", err);
  }
}