// room-booking/src/app/api/bookings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Room from "@/models/Room";


// -----------------------------------------------
// POST /api/bookings — Create a new booking
// -----------------------------------------------
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, roomId, checkIn, checkOut } = body;

    // 1. Validate required fields
    if (!userId || !roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        {
          success: false,
          message: "userId, roomId, checkIn and checkOut are required",
        },
        { status: 400 }
      );
    }

    // 2. Parse dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // 3. Validate date logic
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        {
          success: false,
          message: "checkOut date must be after checkIn date",
        },
        { status: 400 }
      );
    }

    if (checkInDate < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "checkIn date cannot be in the past",
        },
        { status: 400 }
      );
    }

    // 4. Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // 5. Check if room is available
    if (!room.isAvailable) {
      return NextResponse.json(
        { success: false, message: "Room is not available for booking" },
        { status: 400 }
      );
    }

    // 6. Check for double booking — prevent overlapping bookings
    const overlappingBooking = await Booking.findOne({
      room: roomId,
      status: { $ne: "cancelled" },
      $or: [
        // New booking starts during an existing booking
        { checkIn: { $lte: checkInDate }, checkOut: { $gt: checkInDate } },
        // New booking ends during an existing booking
        { checkIn: { $lt: checkOutDate }, checkOut: { $gte: checkOutDate } },
        // New booking completely overlaps an existing booking
        { checkIn: { $gte: checkInDate }, checkOut: { $lte: checkOutDate } },
      ],
    });

    if (overlappingBooking) {
      return NextResponse.json(
        {
          success: false,
          message: "Room is already booked for the selected dates",
        },
        { status: 409 }
      );
    }

    // 7. Calculate total price
    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / msPerDay
    );
    const totalPrice = nights * room.pricePerNight;

    // 8. Create booking
    const booking = await Booking.create({
      user: userId,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      status: "pending",
    });

    // 9. Populate room and user details in response
    const populatedBooking = await booking.populate([
      { path: "room", select: "name pricePerNight type" },
      { path: "user", select: "name email" },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: `Booking created for ${nights} night(s). Total: Ksh ${totalPrice}`,
        data: populatedBooking,
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

    // Build filter
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