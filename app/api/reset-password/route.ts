// app/api/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ── GET /api/reset-password?token=xxx ─────────────────────────────
// Verify token validity
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const tokenParam = new URL(req.url).searchParams.get("token");

    if (!tokenParam) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
        { status: 400 }
      );
    }

    // Decode + hash token
    const decodedToken = decodeURIComponent(tokenParam);

    const hashedToken = crypto
      .createHash("sha256")
      .update(decodedToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Token is invalid or has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GET /api/reset-password error:", error);
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}

// ── POST /api/reset-password ──────────────────────────────────────
// Reset password
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Decode + hash token
    const decodedToken = decodeURIComponent(token);

    const hashedToken = crypto
      .createHash("sha256")
      .update(decodedToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset link has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Save new password
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("POST /api/reset-password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password" },
      { status: 500 }
    );
  }
}