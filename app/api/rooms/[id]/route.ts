// room-booking/src/app/api/rooms/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";
import mongoose from "mongoose";

// Helper to validate MongoDB ObjectId
function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// -----------------------------------------------
// GET /api/rooms/[id] — Fetch a single room
// -----------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid room ID" },
        { status: 400 }
      );
    }

    const room = await Room.findById(id);

    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: room },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/rooms/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------
// PUT /api/rooms/[id] — Update a room (admin)
// -----------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid room ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Prevent updating internal fields
    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedRoom },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/rooms/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update room" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------
// DELETE /api/rooms/[id] — Delete a room (admin)
// -----------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid room ID" },
        { status: 400 }
      );
    }

    const deletedRoom = await Room.findByIdAndDelete(id);

    if (!deletedRoom) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Room deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/rooms/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete room" },
      { status: 500 }
    );
  }
}