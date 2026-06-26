// room-booking/src/app/api/viewing-request/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ViewingRequest from "@/models/ViewingRequest";
import mongoose from "mongoose";

// -----------------------------------------------
// PATCH /api/viewing-request/[id] — Update status (admin)
// -----------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid request ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;

    // Validate status value
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be pending, approved or rejected",
        },
        { status: 400 }
      );
    }

    const updated = await ViewingRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate({ path: "room", select: "name type pricePerNight" })
      .populate({ path: "user", select: "name email phone" });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Viewing request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Viewing request ${status} successfully`,
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/viewing-request/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update viewing request" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------
// DELETE /api/viewing-request/[id] — Delete a request
// -----------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid request ID" },
        { status: 400 }
      );
    }

    const deleted = await ViewingRequest.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Viewing request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Viewing request deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/viewing-request/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete viewing request" },
      { status: 500 }
    );
  }
}