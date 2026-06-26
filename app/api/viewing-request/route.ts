// room-booking/app/api/viewing-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ViewingRequest from "../../../models/ViewingRequest";
import Room from "../../../models/Room";

// -----------------------------------------------
// POST /api/viewing-request — Submit a viewing request
// -----------------------------------------------
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, roomId, preferredDate, message } = body;

    // 1. Validate required fields
    if (!userId || !roomId || !preferredDate) {
      return NextResponse.json(
        {
          success: false,
          message: "userId, roomId and preferredDate are required",
        },
        { status: 400 }
      );
    }

    // 2. Validate preferred date is not in the past
    const preferred = new Date(preferredDate);
    if (preferred < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "Preferred date cannot be in the past",
        },
        { status: 400 }
      );
    }

    // 3. Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // 4. Check if user already has a pending viewing request for this room
    const existingRequest = await ViewingRequest.findOne({
      user: userId,
      room: roomId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a pending viewing request for this room",
        },
        { status: 409 }
      );
    }

    // 5. Create viewing request
    const viewingRequest = await ViewingRequest.create({
      user: userId,
      room: roomId,
      preferredDate: preferred,
      message: message || "",
      status: "pending",
    });

    // 6. Populate response with room and user details
    const populated = await viewingRequest.populate([
      { path: "room", select: "name type pricePerNight" },
      { path: "user", select: "name email phone" },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Viewing request submitted successfully",
        data: populated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/viewing-request error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit viewing request" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------
// GET /api/viewing-request — Fetch viewing requests
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

    const requests = await ViewingRequest.find(filter)
      .populate({ path: "room", select: "name type pricePerNight images" })
      .populate({ path: "user", select: "name email phone" })
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, count: requests.length, data: requests },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/viewing-request error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch viewing requests" },
      { status: 500 }
    );
  }
}