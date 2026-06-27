// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import mongoose from "mongoose";
import { createNotification } from "@/lib/createNotification";

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

    // ── Fire notification based on new status ─────────────────────────────────
    const roomName  = updated.room?.name  ?? "your room";
    const checkIn   = new Date(updated.checkIn).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });
    const checkOut  = new Date(updated.checkOut).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });

    if (status === "confirmed") {
      await createNotification({
        userId:   updated.user._id,
        type:     "booking_confirmed",
        title:    "Booking Confirmed ✅",
        message:  `Your booking for ${roomName} from ${checkIn} to ${checkOut} has been confirmed. We look forward to hosting you!`,
        link:     "/trips",
        refId:    updated._id,
        refModel: "Booking",
      });
    } else if (status === "cancelled") {
      await createNotification({
        userId:   updated.user._id,
        type:     "booking_cancelled",
        title:    "Booking Cancelled",
        message:  `Your booking for ${roomName} from ${checkIn} to ${checkOut} has been cancelled. Contact us if you have any questions.`,
        link:     "/trips",
        refId:    updated._id,
        refModel: "Booking",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: updated,
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