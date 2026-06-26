// room-booking/app/api/staff/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import StaffProfile from "../../../../models/StaffProfile";
import User from "../../../../models/User";
import mongoose from "mongoose";

// PUT /api/staff/[id] — Update staff profile
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    delete body._id;
    delete body.user; // prevent changing the linked user

    const updated = await StaffProfile.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).populate({
      path: "user",
      select: "name email phone photo gender role",
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Staff profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Staff profile updated", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/staff/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update staff profile" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] — Remove staff profile and demote user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }

    const profile = await StaffProfile.findById(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Staff profile not found" },
        { status: 404 }
      );
    }

    // Demote user back to tenant
    await User.findByIdAndUpdate(profile.user, { role: "tenant" });

    // Delete the profile
    await StaffProfile.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Staff profile deleted and user demoted to tenant",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/staff/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete staff profile" },
      { status: 500 }
    );
  }
}