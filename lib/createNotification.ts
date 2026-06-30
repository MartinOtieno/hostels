// lib/createNotification.ts
// ─── Helper used by all API routes to push notifications ─────────────────────

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

// ─── Create a single notification ────────────────────────────────────────────
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

// ─── Notify all admins ────────────────────────────────────────────────────────
export async function notifyAdmins(payload: Omit<NotificationPayload, "userId">) {
  try {
    await connectDB();
    // Import here to avoid circular deps
    const User = (await import("@/models/User")).default;
    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((admin: { _id: mongoose.Types.ObjectId }) =>
        createNotification({ ...payload, userId: admin._id })
      )
    );
  } catch (err) {
    console.error("notifyAdmins error:", err);
  }
}

// ─── Notify all staff of specific positions ───────────────────────────────────
// positions: e.g. ["property_manager", "receptionist"]
// pass empty array [] to notify ALL staff positions
export async function notifyStaff(
  positions: string[],
  payload: Omit<NotificationPayload, "userId">
) {
  try {
    await connectDB();
    const User = (await import("@/models/User")).default;

    const STAFF_POSITIONS = [
      "property_manager",
      "receptionist",
      "caretaker",
      "accountant",
      "security",
      "maintenance",
    ];

    const targetPositions = positions.length > 0 ? positions : STAFF_POSITIONS;

    const staffUsers = await User.find({
      role: { $in: targetPositions },
    }).select("_id");

    await Promise.all(
      staffUsers.map((staff: { _id: mongoose.Types.ObjectId }) =>
        createNotification({ ...payload, userId: staff._id })
      )
    );
  } catch (err) {
    console.error("notifyStaff error:", err);
  }
}

// ─── Notify both admins and relevant staff ────────────────────────────────────
export async function notifyAdminsAndStaff(
  staffPositions: string[],
  payload: Omit<NotificationPayload, "userId">
) {
  await Promise.all([
    notifyAdmins(payload),
    notifyStaff(staffPositions, payload),
  ]);
}