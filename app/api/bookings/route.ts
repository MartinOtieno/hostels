// app/api/bookings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Room from "@/models/Room";
import User from "@/models/User";
import { createNotification } from "@/lib/createNotification";

const BOOKING_STAFF_POSITIONS = ["property_manager", "receptionist", "accountant"];

// ─── Helper: notify all admins ────────────────────────────────────────────────
async function notifyAdmins(payload: {
  type: "booking_pending" | "booking_confirmed" | "booking_cancelled" | "general";
  title: string;
  message: string;
  link: string;
  refId?: unknown;
  refModel?: "Booking" | "ViewingRequest" | null;
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
          refId:    payload.refId as string | undefined,
          refModel: payload.refModel,
        })
      )
    );
  } catch (err) {
    console.error("notifyAdmins error:", err);
  }
}

// ─── Helper: notify relevant staff positions ─────────────────────────────────
async function notifyStaff(payload: {
  type: "booking_pending" | "booking_confirmed" | "booking_cancelled" | "general";
  title: string;
  message: string;
  link: string;
  refId?: unknown;
  refModel?: "Booking" | "ViewingRequest" | null;
}) {
  try {
    const staff = await User.find({
      role: { $in: BOOKING_STAFF_POSITIONS },
    }).select("_id");
    await Promise.all(
      staff.map(s =>
        createNotification({
          userId:   s._id,
          type:     payload.type,
          title:    payload.title,
          message:  payload.message,
          link:     payload.link,
          refId:    payload.refId as string | undefined,
          refModel: payload.refModel,
        })
      )
    );
  } catch (err) {
    console.error("notifyStaff error:", err);
  }
}

// -----------------------------------------------
// POST /api/bookings — Create a new booking
// -----------------------------------------------
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, roomId, checkIn, checkOut } = body;

    if (!userId || !roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, message: "userId, roomId, checkIn and checkOut are required" },
        { status: 400 }
      );
    }

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, message: "checkOut date must be after checkIn date" },
        { status: 400 }
      );
    }

    if (checkInDate < new Date()) {
      return NextResponse.json(
        { success: false, message: "checkIn date cannot be in the past" },
        { status: 400 }
      );
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    if (!room.isAvailable) {
      return NextResponse.json(
        { success: false, message: "Room is not available for booking" },
        { status: 400 }
      );
    }

    const overlappingBooking = await Booking.findOne({
      room:   roomId,
      status: { $ne: "cancelled" },
      $or: [
        { checkIn: { $lte: checkInDate },  checkOut: { $gt: checkInDate }   },
        { checkIn: { $lt: checkOutDate },  checkOut: { $gte: checkOutDate } },
        { checkIn: { $gte: checkInDate },  checkOut: { $lte: checkOutDate } },
      ],
    });

    if (overlappingBooking) {
      return NextResponse.json(
        { success: false, message: "Room is already booked for the selected dates" },
        { status: 409 }
      );
    }

    const msPerDay   = 1000 * 60 * 60 * 24;
    const nights     = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay);
    const totalPrice = nights * room.pricePerNight;

    const booking = await Booking.create({
      user:       userId,
      room:       roomId,
      checkIn:    checkInDate,
      checkOut:   checkOutDate,
      totalPrice,
      status:     "pending",
    });

    const populatedBooking = await booking.populate([
      { path: "room", select: "name pricePerNight type" },
      { path: "user", select: "name email" },
    ]);

    const checkInFmt  = checkInDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
    const checkOutFmt = checkOutDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
    const guestName   = populatedBooking.user?.name ?? "A guest";

    // 🔔 Notify the guest
    await createNotification({
      userId,
      type:     "booking_pending",
      title:    "Booking Received ⏳",
      message:  `Your booking for ${room.name} from ${checkInFmt} to ${checkOutFmt} (${nights} night${nights > 1 ? "s" : ""}) has been received and is awaiting confirmation. Total: Ksh ${totalPrice.toLocaleString()}.`,
      link:     "/trips",
      refId:    booking._id,
      refModel: "Booking",
    });

    const staffNotifPayload = {
      type:     "booking_pending" as const,
      title:    "New Booking Request 🏠",
      message:  `${guestName} has requested to book ${room.name} from ${checkInFmt} to ${checkOutFmt} for Ksh ${totalPrice.toLocaleString()}. Review and confirm.`,
      refId:    booking._id,
      refModel: "Booking" as const,
    };

    // 🔔 Notify admins
    await notifyAdmins({ ...staffNotifPayload, link: "/admin/bookings" });

    // 🔔 Notify relevant staff
    await notifyStaff({ ...staffNotifPayload, link: "/staff/bookings" });

    return NextResponse.json(
      {
        success: true,
        message: `Booking created for ${nights} night(s). Total: Ksh ${totalPrice}`,
        data:    populatedBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------
// GET /api/bookings — Fetch bookings
// -----------------------------------------------
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const roomId = searchParams.get("roomId");
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (userId) filter.user = userId;
    if (roomId) filter.room = roomId;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate({ path: "room", select: "name pricePerNight type images" })
      .populate({ path: "user", select: "name email phone" })
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, count: bookings.length, data: bookings },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}