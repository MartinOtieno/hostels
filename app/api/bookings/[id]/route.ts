// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import User from "@/models/User";
import mongoose from "mongoose";
import { createNotification } from "@/lib/createNotification";

// ─── Helper: notify all admins ────────────────────────────────────────────────
async function notifyAdmins(payload: {
  type: "booking_confirmed" | "booking_cancelled" | "booking_pending" | "general";
  title: string;
  message: string;
  link: string;
  refId?: mongoose.Types.ObjectId;
}) {
  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map(admin =>
        createNotification({
          userId:   admin._id,
          type:     payload.type,
          title:    payload.title,
          message:  payload.message,
          link:     payload.link,
          refId:    payload.refId,
          refModel: "Booking",
        })
      )
    );
  } catch (err) {
    console.error("notifyAdmins error:", err);
  }
}

// ─── PATCH /api/bookings/[id] ─────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const { status } = await req.json();

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("room", "name type pricePerNight images")
      .populate("user", "name email");

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const roomName    = updated.room?.name ?? "the room";
    const guestName   = updated.user?.name ?? "A guest";
    const checkInFmt  = new Date(updated.checkIn).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
    const checkOutFmt = new Date(updated.checkOut).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

    if (status === "confirmed") {
      // Notify guest
      await createNotification({
        userId:   updated.user._id,
        type:     "booking_confirmed",
        title:    "Booking Confirmed ✅",
        message:  `Your booking for ${roomName} from ${checkInFmt} to ${checkOutFmt} has been confirmed. We look forward to hosting you!`,
        link:     "/trips",
        refId:    updated._id,
        refModel: "Booking",
      });

      // Notify admins
      await notifyAdmins({
        type:    "booking_confirmed",
        title:   "Booking Confirmed ✅",
        message: `${guestName}'s booking for ${roomName} from ${checkInFmt} to ${checkOutFmt} has been confirmed.`,
        link:    "/admin/bookings",
        refId:   updated._id,
      });

    } else if (status === "cancelled") {
      // Notify guest
      await createNotification({
        userId:   updated.user._id,
        type:     "booking_cancelled",
        title:    "Booking Cancelled ❌",
        message:  `Your booking for ${roomName} from ${checkInFmt} to ${checkOutFmt} has been cancelled. Contact us if you have any questions.`,
        link:     "/trips",
        refId:    updated._id,
        refModel: "Booking",
      });

      // Notify admins
      await notifyAdmins({
        type:    "booking_cancelled",
        title:   "Booking Cancelled ❌",
        message: `${guestName}'s booking for ${roomName} from ${checkInFmt} to ${checkOutFmt} has been cancelled.`,
        link:    "/admin/bookings",
        refId:   updated._id,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${status} successfully`,
      data:    updated,
    });
  } catch (error) {
    console.error("PATCH /api/bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// ─── GET /api/bookings/[id] ───────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(id)
      .populate("room", "name type pricePerNight images")
      .populate("user", "name email");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("GET /api/bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}