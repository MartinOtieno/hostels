// room-booking/app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import StaffProfile from "@/models/StaffProfile";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── GET /api/profile ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Valid userId is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const staffProfile = await StaffProfile.findOne({ user: userId });

    return NextResponse.json(
      { success: true, data: { user, staffProfile } },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/profile ───────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    let { userId, name, email, phone, photo, gender } = body;

    // ── Resolve userId from session if not in body ────────────────────────────
    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = (session?.user as any)?.id;
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Valid userId is required" },
        { status: 400 }
      );
    }

    // ── Reject raw base64 photos — frontend must upload to Cloudinary first ──
    if (photo && photo.startsWith("data:")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Photo must be a URL. Upload the image to Cloudinary first and send the returned URL.",
        },
        { status: 400 }
      );
    }

    // ── Build update object ───────────────────────────────────────────────────
    const updateData: Record<string, any> = {};
    if (name   !== undefined) updateData.name   = String(name).trim();
    if (email  !== undefined) updateData.email  = String(email).trim().toLowerCase();
    if (phone  !== undefined) updateData.phone  = String(phone).trim();
    if (photo  !== undefined) updateData.photo  = photo;
    if (gender !== undefined) updateData.gender = gender;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields provided to update" },
        { status: 400 }
      );
    }

    // ✅ FIX: use returnDocument instead of deprecated `new: true`
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const staffProfile = await StaffProfile.findOne({ user: userId });

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: { user: updatedUser, staffProfile },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PATCH /api/profile error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Email already in use by another account" },
        { status: 409 }
      );
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((e: any) => e.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation error: ${messages}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}