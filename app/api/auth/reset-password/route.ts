// app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// ── GET /api/auth/reset-password/verify?token=xxx ─────────────────────────────
// Called by the reset page on mount to check if the token is still valid
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = new URL(req.url).searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, message: "Token is required" }, { status: 400 });
    }

    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Token is invalid or has expired" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GET /api/auth/reset-password/verify error:", error);
    return NextResponse.json({ success: false, message: "Verification failed" }, { status: 500 });
  }
}

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ success: false, message: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Hash and save new password, clear the reset token
    user.password             = await bcrypt.hash(password, 12);
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json({ success: false, message: "Failed to reset password" }, { status: 500 });
  }
}